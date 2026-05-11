// enemies.js — pixelated octopus enemies (grid fillRect, NOT arcs), wave spawning, boss logic

const Enemies = (() => {
  let list = [];
  let powerups = [];
  let damageNumbers = [];

  // Pixel grids for each octopus type (1 = filled, 0 = empty)
  const GRIDS = {
    small: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,1,0,1,1,0,1,0],
      [0,1,0,0,0,0,1,0],  // tentacle row
      [0,0,0,0,0,0,0,0],
    ],
    medium: [
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,0,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,0,1,1,1,1,0,1,1],
      [0,1,0,1,0,0,1,0,1,0],
      [0,1,0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
    baby: [
      [0,1,1,1,1,0],
      [1,1,0,0,1,1],
      [1,1,1,1,1,1],
      [0,1,1,1,1,0],
      [0,1,0,0,1,0],
      [0,0,0,0,0,0],
    ],
    boss: [
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,0,0,1,1,0,0,1,1,1,0],
      [0,1,1,1,0,0,1,1,0,0,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,0,1,1,1,1,0,1,1,0,0],
      [0,1,0,1,0,0,0,0,0,0,1,0,1,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ],
  };

  let frame = 0;
  let inkBlobs = [];

  function spawnWave(level, W) {
    const isBossLevel = level % CONFIG.BOSS_EVERY === 0;
    if (isBossLevel) {
      // Pre-boss swarm
      for (let i = 0; i < 6; i++) {
        spawnOne('small', W * (i + 1) / 7, -50, level);
      }
      setTimeout(() => spawnOne('boss', W / 2, -150, level), 1500);
    } else {
      const count = 3 + Math.floor(level * 0.5);
      for (let i = 0; i < count; i++) {
        const types = ['small', 'medium'];
        const t = types[Math.floor(Math.random() * types.length)];
        spawnOne(t, W * (i + 1) / (count + 1), -50 - i * 30, level);
      }
    }
  }

  function spawnOne(type, x, y, level) {
    const size = CONFIG.ENEMY_SIZES[type];
    const grid = GRIDS[type];
    const maxHP = type === 'boss' ? 300 + level * 30 : type === 'medium' ? 30 : type === 'baby' ? 10 : 20;
    list.push({
      type, x, y, size, grid,
      vx: (Math.random() - 0.5) * (1 + level * 0.1),
      vy: type === 'boss' ? 0.5 : 0.8 + level * 0.05,
      hp: maxHP, maxHP,
      hitFlash: 0,
      shootTimer: Math.random() * 60,
      sineOffset: Math.random() * Math.PI * 2,
      tentacleAnim: 0,
    });
  }

  function update(W, H, playerX, playerY, bullets, unleash, piIdx, level) {
    frame++;

    // Ink blobs
    inkBlobs = inkBlobs.filter(b => {
      b.x += b.vx; b.y += b.vy; b.life--;
      return b.life > 0 && b.y < H;
    });

    list = list.filter(e => {
      // Movement
      if (e.type === 'small') {
        e.x += e.vx + Math.sin(frame * 0.05 + e.sineOffset) * 1.5;
      } else if (e.type === 'boss') {
        e.x += Math.sin(frame * 0.02 + e.sineOffset) * 2;
      } else {
        e.x += e.vx;
      }
      e.y += e.vy;
      e.tentacleAnim = Math.floor(frame / 15) % 2;

      // Bounce walls
      if (e.x < e.size/2 || e.x > W - e.size/2) e.vx *= -1;

      // Medium shoots ink
      if (e.type === 'medium') {
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          e.shootTimer = 80 + Math.random() * 60;
          const dx = playerX - e.x;
          const dy = playerY - e.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          inkBlobs.push({
            x: e.x, y: e.y,
            vx: dx/dist * 3, vy: dy/dist * 3,
            r: 6, life: 120, color: CONFIG.COLORS.medium,
          });
        }
      }

      // Boss shoots bursts
      if (e.type === 'boss') {
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          e.shootTimer = 40;
          for (let a = 0; a < 8; a++) {
            const angle = (a / 8) * Math.PI * 2;
            inkBlobs.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
              r: 8, life: 80, color: CONFIG.COLORS.boss,
            });
          }
        }
      }

      e.hitFlash = Math.max(0, e.hitFlash - 1);

      // Off screen
      if (e.y > H + e.size) return false;

      return true;
    });

    // Damage numbers
    damageNumbers = damageNumbers.filter(d => {
      d.y -= 1; d.life--;
      return d.life > 0;
    });

    return { inkBlobs };
  }

  function checkBulletCollisions(bullets, unleash, piIdx, onKill, onHit) {
    const toRemove = new Set();
    list.forEach(e => {
      bullets.forEach((b, bi) => {
        if (toRemove.has(bi)) return;
        const dx = b.x - e.x, dy = b.y - e.y;
        const r = CONFIG.BULLET_RADIUS + e.size / 2;
        if (dx*dx + dy*dy < r*r) {
          const dmg = unleash ? 50 : 10;
          e.hp -= dmg;
          e.hitFlash = 3;
          toRemove.add(bi);
          Particles.spawnSparks(b.x, b.y, CONFIG.COLORS.bullet);
          Audio.hit();
          damageNumbers.push({ x: e.x, y: e.y - e.size/2, text: `-${dmg}`, life: 60 });
          onHit(e);
          if (e.hp <= 0) {
            Particles.spawnExplosion(e.x, e.y, e.size, CONFIG.COLORS[e.type], unleash, piIdx);
            Particles.spawnInkSplatter(e.x, e.y, e.type, unleash, piIdx);
            Audio.explosion(e.size / 50);
            if (e.type === 'medium') {
              // Splits into 2 babies
              for (let i = 0; i < 2; i++) {
                list.push({
                  type:'baby', x: e.x + (i?20:-20), y: e.y,
                  size: CONFIG.ENEMY_SIZES.baby,
                  grid: GRIDS.baby,
                  vx: (Math.random()-0.5)*4, vy: 2,
                  hp:10, maxHP:10, hitFlash:0,
                  shootTimer:999, sineOffset:0, tentacleAnim:0,
                });
              }
            }
            if (e.type === 'boss' || e.type === 'medium') {
              powerups.push({ x: e.x, y: e.y, vy: 1.5, r: 12, pulse: 0 });
              Particles.spawnPowerupSparkle(e.x, e.y);
            }
            onKill(e);
            return false;
          }
        }
      });
    });
    list = list.filter(e => e.hp > 0);
    return [...toRemove].sort((a,b) => b-a); // indices to remove, descending
  }

  function checkPlayerCollision(px, py, onHit) {
    const PR = CONFIG.SHIP_RADIUS + 30;
    // Enemies
    for (const e of list) {
      const dx = px - e.x, dy = py - e.y;
      if (dx*dx + dy*dy < (PR + e.size/2) * (PR + e.size/2)) {
        onHit(15);
        return true;
      }
    }
    // Ink blobs
    for (const b of inkBlobs) {
      const dx = px - b.x, dy = py - b.y;
      if (dx*dx + dy*dy < (PR + b.r) * (PR + b.r)) {
        onHit(8);
        return true;
      }
    }
    return false;
  }

  function checkPowerupCollision(px, py, onCollect) {
    powerups = powerups.filter(p => {
      p.y += p.vy;
      p.pulse++;
      const dx = px - p.x, dy = py - p.y;
      if (dx*dx + dy*dy < (CONFIG.SHIP_RADIUS + p.r) * (CONFIG.SHIP_RADIUS + p.r)) {
        onCollect();
        return false;
      }
      return p.y < 2000;
    });
  }

  function drawGrid(ctx, e, color) {
    const grid = e.grid;
    const rows = grid.length;
    const cols = grid[0].length;
    const cellW = e.size / cols;
    const cellH = e.size / rows;
    const ox = e.x - e.size / 2;
    const oy = e.y - e.size / 2;

    ctx.fillStyle = e.hitFlash > 0 ? '#FFFFFF' : color;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cell = grid[r][c];
        // Animate tentacles (last 2 rows)
        if (r >= rows - 2 && e.tentacleAnim === 1) cell = grid[r][c] ? 0 : (r === rows-2 ? 1 : 0);
        if (cell) ctx.fillRect(ox + c*cellW, oy + r*cellH, cellW-1, cellH-1);
      }
    }
  }

  function draw(ctx, unleash, piIdx) {
    // Ink blobs
    for (const b of inkBlobs) {
      ctx.globalAlpha = b.life / 120;
      ctx.fillStyle = unleash ? piHslToHex(piIdx % 10) : b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Powerups
    for (const p of powerups) {
      const pulse = Math.sin(p.pulse * 0.1) * 3;
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15 + pulse;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', p.x, p.y + 4);
      ctx.restore();
    }

    // Enemies
    for (const e of list) {
      ctx.save();
      if (e.type === 'boss') {
        ctx.shadowColor = CONFIG.COLORS.boss;
        ctx.shadowBlur = 20;
      }
      const color = unleash ? piHslToHex((piIdx + list.indexOf(e)) % 10) : CONFIG.COLORS[e.type];
      drawGrid(ctx, e, color);

      // Boss HP bar
      if (e.type === 'boss') {
        const bw = e.size;
        const bx = e.x - bw/2;
        const by = e.y + e.size/2 + 8;
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, by, bw, 6);
        ctx.fillStyle = '#CC44FF';
        ctx.fillRect(bx, by, bw * (e.hp / e.maxHP), 6);
      }
      ctx.restore();
    }

    // Damage numbers
    for (const d of damageNumbers) {
      ctx.globalAlpha = d.life / 60;
      ctx.fillStyle = '#FFD700';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.text, d.x, d.y);
    }
    ctx.globalAlpha = 1;
  }

  function getList() { return list; }
  function clear() { list = []; powerups = []; inkBlobs = []; damageNumbers = []; }

  return { spawnWave, update, checkBulletCollisions, checkPlayerCollision, checkPowerupCollision, draw, getList, clear };
})();
