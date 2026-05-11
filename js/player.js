// player.js — ship rendering, mouse tracking, weapons, upgrade tiers, health, engine trail

const Player = (() => {
  let x, y, hp, maxHP, tier, tilt, mouseX, mouseY;
  let shootCooldown = 0;
  let W, H;
  let screenFlash = 0;

  function init(w, h) {
    W = w; H = h;
    x = w / 2; y = h - 100;
    hp = CONFIG.SHIP_MAX_HP;
    maxHP = CONFIG.SHIP_MAX_HP;
    tier = 0; tilt = 0;
    mouseX = w / 2; mouseY = h - 100;
    screenFlash = 0;
  }

  function setMouse(mx, my) { mouseX = mx; mouseY = my; }

  function update(unleash, piIdx) {
    // Lerp toward mouse
    const prevX = x;
    x += (mouseX - x) * CONFIG.SHIP_LERP;
    y += (mouseY - y) * CONFIG.SHIP_LERP * 0.3;
    y = Math.max(H * 0.3, Math.min(H - 40, y));
    x = Math.max(30, Math.min(W - 30, x));

    // Tilt on horizontal movement
    const dx = x - prevX;
    tilt += (dx * 0.15 - tilt) * 0.2;
    tilt = Math.max(-0.4, Math.min(0.4, tilt));

    // Engine trails
    const trailColor = unleash ? piHslToHex(piIdx % 10) : CONFIG.TIER_GLOWS[tier];
    Particles.spawnEngineTrail(x - 8, y + 18, tier, unleash, piIdx % 10);
    Particles.spawnEngineTrail(x + 8, y + 18, tier, unleash, (piIdx + 3) % 10);

    if (screenFlash > 0) screenFlash--;
    if (shootCooldown > 0) shootCooldown--;
  }

  function shoot(unleash, piIdx) {
    const cooldown = [8, 6, 5, 4][tier];
    if (shootCooldown > 0) return [];
    shootCooldown = cooldown;

    const speed = CONFIG.BULLET_SPEEDS[tier];
    const color = unleash ? piHslToHex(piIdx % 10) : CONFIG.COLORS.bullet;
    const bullets = [];

    Audio.laser();

    if (tier === 0) {
      bullets.push({ x, y: y - 20, vy: -speed, color, r: CONFIG.BULLET_RADIUS });
    } else if (tier === 1) {
      bullets.push({ x: x-8, y: y-15, vy: -speed, color, r: CONFIG.BULLET_RADIUS });
      bullets.push({ x: x+8, y: y-15, vy: -speed, color, r: CONFIG.BULLET_RADIUS });
    } else if (tier === 2) {
      bullets.push({ x, y: y-20, vy: -speed, color, r: CONFIG.BULLET_RADIUS });
      bullets.push({ x: x-10, y: y-15, vy: -speed*0.95, vx: -1, color, r: CONFIG.BULLET_RADIUS });
      bullets.push({ x: x+10, y: y-15, vy: -speed*0.95, vx:  1, color, r: CONFIG.BULLET_RADIUS });
    } else {
      // Tier 4: homing + spread
      for (let i = -2; i <= 2; i++) {
        bullets.push({ x: x + i*8, y: y-20, vy: -speed, vx: i*0.8, color, r: CONFIG.BULLET_RADIUS, homing: true });
      }
    }

    if (unleash) {
      // Massive spread beams during unleash
      for (let i = -4; i <= 4; i++) {
        bullets.push({ x: x + i*12, y: y-20, vy: -speed*1.3, vx: i*0.5, color: piHslToHex((piIdx+i+10)%10), r: CONFIG.BULLET_RADIUS * 2 });
      }
    }

    return bullets;
  }

  function takeDamage(amount) {
    hp = Math.max(0, hp - amount);
    screenFlash = 8;
  }

  function setTier(t) { tier = Math.min(3, t); }

  function draw(ctx, unleash, piIdx) {
    // Screen flash on hit
    if (screenFlash > 0) {
      ctx.fillStyle = `rgba(255,50,50,${screenFlash/8 * 0.3})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    const glow = unleash ? piHslToHex(piIdx % 10) : CONFIG.TIER_GLOWS[tier];

    if (unleash) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 30;
    } else {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12;
    }

    // Ship body — pixel art F-117 style
    ctx.fillStyle = '#2A2E35'; // gunmetal
    // Main body
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.lineTo(6, -8);
    ctx.closePath();
    ctx.fill();

    // Wings
    const wingW = [14, 18, 22, 26][tier];
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-wingW, 16);
    ctx.lineTo(-wingW + 4, 16);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(wingW, 16);
    ctx.lineTo(wingW - 4, 16);
    ctx.lineTo(6, 4);
    ctx.closePath();
    ctx.fill();

    // Glow edge
    ctx.strokeStyle = glow;
    ctx.lineWidth = unleash ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-wingW, 16);
    ctx.lineTo(wingW, 16);
    ctx.closePath();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Unleash countdown ring
    if (unleash) {
      ctx.strokeStyle = piHslToHex((piIdx + 5) % 10);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 28, -Math.PI/2, -Math.PI/2 + Math.PI*2 * (unleash/CONFIG.UNLEASH_DURATION));
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawUnleashScreen(ctx) {
    // Chromatic aberration overlay during unleash
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,0,0,0.03)';
    ctx.fillRect(2, 0, W, H);
    ctx.fillStyle = 'rgba(0,255,0,0.03)';
    ctx.fillRect(-2, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,255,0.03)';
    ctx.fillRect(0, 2, W, H);
    ctx.restore();
  }

  function getPos() { return { x, y }; }
  function getHP() { return hp; }
  function getMaxHP() { return maxHP; }
  function getTier() { return tier; }
  function isDead() { return hp <= 0; }

  return { init, setMouse, update, shoot, takeDamage, setTier, draw, drawUnleashScreen, getPos, getHP, getMaxHP, getTier, isDead };
})();
