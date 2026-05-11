// particles.js — explosions, ink splatter, engine trails, bullet trails, sparks, powerup sparkles
// Includes adaptive performance budget — self-monitors frame delta and backs off particle
// spawn counts when the system is falling behind, ramps back up when it catches up.

const Particles = (() => {
  let pool = [];

  // ── Adaptive budget ────────────────────────────────────────────────────────
  // Tracks rolling frame time. budget (0.2–1.0) scales all spawn counts.
  // Falls fast on pressure, recovers slowly — keeps motion smooth under load.
  const BUDGET = {
    value: 1.0,          // current multiplier applied to all spawn counts
    lastTime: 0,         // timestamp of last update() call
    history: [],         // rolling window of last 10 frame deltas (ms)
    WINDOW: 10,
    TARGET_MS: 16.67,    // 60fps budget per frame
    WARN_MS: 20,         // start backing off above this
    CRITICAL_MS: 33,     // floor budget at this threshold (30fps)
    MIN: 0.2,            // never go below 20% — keep feel alive
    MAX: 1.0,
    DECAY: 0.92,         // how fast we back off (per frame over budget)
    RECOVER: 0.02,       // how fast we ramp back up (per frame under budget)
    POOL_CAP: 800,       // hard cap — cull oldest particles if exceeded
  };

  function _updateBudget() {
    const now = performance.now();
    if (BUDGET.lastTime === 0) { BUDGET.lastTime = now; return; }
    const dt = now - BUDGET.lastTime;
    BUDGET.lastTime = now;

    BUDGET.history.push(dt);
    if (BUDGET.history.length > BUDGET.WINDOW) BUDGET.history.shift();

    const avg = BUDGET.history.reduce((a, b) => a + b, 0) / BUDGET.history.length;

    if (avg > BUDGET.WARN_MS) {
      // Falling behind — back off proportionally to how far over budget we are
      const pressure = Math.min(1, (avg - BUDGET.WARN_MS) / (BUDGET.CRITICAL_MS - BUDGET.WARN_MS));
      BUDGET.value = Math.max(BUDGET.MIN, BUDGET.value * (BUDGET.DECAY - pressure * 0.05));
    } else {
      // Under budget — recover slowly
      BUDGET.value = Math.min(BUDGET.MAX, BUDGET.value + BUDGET.RECOVER);
    }

    // Hard pool cap — cull the oldest (front of array) if we're over limit
    if (pool.length > BUDGET.POOL_CAP) {
      pool.splice(0, pool.length - BUDGET.POOL_CAP);
    }
  }

  function _scaledCount(requested, priority = 'normal') {
    // priority: 'high' (explosions) get more budget, 'low' (trails) get less
    const scale = priority === 'high'
      ? Math.max(BUDGET.MIN + 0.1, BUDGET.value)
      : priority === 'low'
        ? BUDGET.value * 0.6
        : BUDGET.value;
    return Math.max(1, Math.round(requested * scale));
  }
  // ──────────────────────────────────────────────────────────────────────────

  function spawn(x, y, opts = {}) {
    const count = opts.count || 8;
    for (let i = 0; i < count; i++) {
      const angle = opts.angle !== undefined ? opts.angle + (Math.random()-0.5)*opts.spread : Math.random() * Math.PI * 2;
      const speed = opts.speed || (Math.random() * 3 + 1);
      pool.push({
        x, y,
        vx: Math.cos(angle) * speed * (Math.random() * 0.5 + 0.75),
        vy: Math.sin(angle) * speed * (Math.random() * 0.5 + 0.75),
        life: opts.life || (Math.random() * 30 + 20),
        maxLife: opts.life || 50,
        size: opts.size || (Math.random() * 3 + 1),
        color: opts.color || '#FFFFFF',
        type: opts.type || 'dot',
        glow: opts.glow || false,
      });
    }
  }

  function spawnEngineTrail(x, y, tier, unleash, piIndex) {
    const color = unleash ? piHslToHex(piIndex) : CONFIG.TIER_GLOWS[tier];
    spawn(x, y, {
      count: _scaledCount(2, 'low'),
      angle: Math.PI / 2,
      spread: 0.5,
      speed: Math.random() * 2 + 1,
      life: 20,
      size: Math.random() * 3 + 1,
      color,
      type: 'dot',
    });
  }

  function spawnBulletTrail(x, y, color) {
    if (BUDGET.value < 0.5) return; // trails are first to go under pressure
    spawn(x, y, {
      count: 1,
      angle: Math.PI / 2,
      spread: 0.3,
      speed: 0.5,
      life: 8,
      size: 2,
      color,
      type: 'dot',
    });
  }

  function spawnSparks(x, y, color) {
    spawn(x, y, {
      count: _scaledCount(4, 'normal'),
      speed: 3,
      life: 15,
      size: 2,
      color: '#FFFFFF',
      type: 'dot',
    });
  }

  function spawnExplosion(x, y, size, color, unleash, piIndex) {
    const c = unleash ? piHslToHex(piIndex) : color;
    spawn(x, y, {
      count: _scaledCount(Math.floor(size / 5) + 8, 'high'),
      speed: size / 10 + 2,
      life: 40 + size,
      size: size / 8 + 2,
      color: c,
      type: 'dot',
      glow: true,
    });
    // Core burst
    spawn(x, y, {
      count: 4,
      speed: 1,
      life: 20,
      size: size / 6,
      color: unleash ? piHslToHex((piIndex + 3) % 10) : '#00FF88',
      type: 'dot',
    });
  }

  function spawnInkSplatter(x, y, type, unleash, piIndex) {
    const baseColor = CONFIG.COLORS[type] || '#FF00FF';
    const count = _scaledCount(12, 'normal');
    for (let i = 0; i < count; i++) {
      const idx = (piIndex + i) % 10;
      const color = unleash ? piHslToHex(idx) : baseColor;
      spawn(x, y, {
        count: 1,
        speed: Math.random() * 4 + 1,
        life: 35 + Math.random() * 20,
        size: Math.random() * 4 + 2,
        color,
        type: 'dot',
      });
    }
  }

  function spawnPowerupSparkle(x, y) {
    spawn(x, y, {
      count: _scaledCount(6, 'normal'),
      speed: 2,
      life: 25,
      size: 3,
      color: '#FFD700',
      type: 'dot',
      glow: true,
    });
  }

  function update() {
    _updateBudget();
    pool = pool.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // slight gravity
      p.life--;
      return p.life > 0;
    });
  }

  function draw(ctx) {
    const budget = BUDGET.value; // use directly — getBudget() is external only
    const doGlow = budget > 0.65;

    // Non-glow pass — batch all into one path (same fill won't work but
    // grouping by color is expensive; instead draw all non-glow with globalAlpha
    // set per-particle but no save/restore)
    for (const p of pool) {
      if (p.glow && doGlow) continue; // handled in glow pass
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow pass — only when budget allows, one save/restore total
    if (doGlow) {
      ctx.save();
      for (const p of pool) {
        if (!p.glow) continue;
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Reset alpha
    ctx.globalAlpha = 1;
  }

  return { spawn, spawnEngineTrail, spawnBulletTrail, spawnSparks, spawnExplosion, spawnInkSplatter, spawnPowerupSparkle, update, draw, getBudget: () => BUDGET.value };
})();

// Pi palette helper — shared by particles and game
let _piIdx = 0;
function piHslToHex(idx) {
  const m = CONFIG.PI_HUE_MAP[idx % 10];
  return hslToHex(m.h, m.s, 0.55);
}
function nextPiColor() {
  const d = parseInt(CONFIG.PI_STR[_piIdx % CONFIG.PI_STR.length]);
  _piIdx++;
  return piHslToHex(d);
}
function resetPiIdx() { _piIdx = 0; }
function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
