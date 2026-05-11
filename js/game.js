// game.js — main loop, state machine (menu/playing/paused/gameover), collision, screen shake

const Game = (() => {
  let canvas, ctx;
  let state = 'menu'; // menu | playing | paused | gameover
  let score, level, kills, combo, comboTimer;
  let bullets = [];
  let mouseDown = false;
  let frame = 0;
  let spawnTimer = 0;
  let unleash = 0;      // frames remaining
  let piColorIdx = 0;   // advances each killed enemy during unleash
  let shakeX = 0, shakeY = 0, shakeMag = 0;
  let W, H;

  function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', e => {
      Background.setMouse(e.clientX, e.clientY);
      Player.setMouse(e.clientX, e.clientY);
    });
    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      Audio.resume();
      if (state === 'menu') { startGame(); return; }
      if (state === 'gameover') { startGame(); return; }
      mouseDown = true;
    });
    canvas.addEventListener('mouseup', () => mouseDown = false);
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (state === 'playing') state = 'paused';
        else if (state === 'paused') state = 'playing';
      }
    });

    Audio.init();
    Background.init(W, H);
    UI.init(W, H);
    resetPiIdx();

    loop();
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    Background.resize(W, H);
    UI.resize(W, H);
    if (state === 'playing') Player.init(W, H);
  }

  function startGame() {
    state = 'playing';
    score = 0; level = 1; kills = 0; combo = 0; comboTimer = 0;
    bullets = []; frame = 0; spawnTimer = 0;
    unleash = 0; piColorIdx = 0; shakeMag = 0;
    resetPiIdx();
    Enemies.clear();
    Player.init(W, H);
    Audio.startAmbient();
    spawnWave();
  }

  function spawnWave() {
    Enemies.spawnWave(level, W);
    if (level % CONFIG.BOSS_EVERY === 0) {
      Audio.bossAlarm();
    }
  }

  function screenShake(mag) {
    shakeMag = Math.max(shakeMag, mag);
  }

  function loop() {
    requestAnimationFrame(loop);
    frame++;

    // Shake decay
    if (shakeMag > 0) {
      shakeX = (Math.random()-0.5) * shakeMag * 2;
      shakeY = (Math.random()-0.5) * shakeMag * 2;
      shakeMag *= 0.85;
      if (shakeMag < 0.5) { shakeMag = 0; shakeX = 0; shakeY = 0; }
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    Background.update();
    Background.draw(ctx);

    if (state === 'menu') {
      UI.drawStart(ctx);
      ctx.restore();
      return;
    }

    if (state === 'paused') {
      Player.draw(ctx, false, 0);
      Particles.draw(ctx);
      Enemies.draw(ctx, false, 0);
      UI.drawHUD(ctx, score, level, combo, Player.getHP(), Player.getMaxHP(), unleash);
      UI.drawPaused(ctx);
      ctx.restore();
      return;
    }

    if (state === 'gameover') {
      Particles.update();
      Particles.draw(ctx);
      UI.drawGameOver(ctx, score, level, kills);
      ctx.restore();
      return;
    }

    // ── PLAYING ──

    // Unleash tick
    const isUnleash = unleash > 0;
    if (isUnleash) {
      unleash--;
      piColorIdx++;
      Player.drawUnleashScreen(ctx);
    }

    // Combo timer
    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer === 0) combo = 0;
    }

    // Player update
    Player.update(isUnleash, piColorIdx);

    // Shoot
    if (mouseDown) {
      const newBullets = Player.shoot(isUnleash, piColorIdx);
      bullets.push(...newBullets);
    }

    // Bullet update
    bullets = bullets.filter(b => {
      b.x += b.vx || 0;
      b.y += b.vy;
      Particles.spawnBulletTrail(b.x, b.y, b.color);
      return b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20;
    });

    // Enemy update
    Enemies.update(W, H, Player.getPos().x, Player.getPos().y, bullets, isUnleash, piColorIdx, level);

    // Bullet-enemy collision
    const toRemove = Enemies.checkBulletCollisions(
      bullets, isUnleash, piColorIdx,
      (e) => {
        // On kill
        kills++;
        const pts = { small:10, medium:25, baby:5, boss:200 }[e.type] * (1 + combo * 0.1) * (isUnleash ? CONFIG.UNLEASH_MULTIPLIER : 1);
        score += Math.floor(pts);
        combo++;
        comboTimer = 120;
        piColorIdx++;
        screenShake(e.size / 15);

        // Level up check
        if (kills % 10 === 0) {
          level++;
          Player.setTier(Math.floor(level / CONFIG.UPGRADE_EVERY));
          spawnWave();
        }
      },
      (e) => { /* on hit */ }
    );
    for (const i of toRemove) bullets.splice(i, 1);

    // Player-enemy collision
    Enemies.checkPlayerCollision(Player.getPos().x, Player.getPos().y, (dmg) => {
      Player.takeDamage(dmg);
      screenShake(4);
      combo = 0;
    });

    // Powerup collection
    Enemies.checkPowerupCollision(Player.getPos().x, Player.getPos().y, () => {
      unleash = CONFIG.UNLEASH_DURATION;
      piColorIdx = 0;
      Audio.powerup();
      setTimeout(() => Audio.unleash(), 200);
    });

    // Particles
    Particles.update();

    // Draw order: enemies, bullets, player, particles
    Enemies.draw(ctx, isUnleash, piColorIdx);

    // Bullets — one save/restore for all, adaptive glow
    const budget = Particles.getBudget();
    ctx.save();
    ctx.shadowBlur = budget > 0.6 ? 6 : 0; // drop glow under pressure, never drop color
    for (const b of bullets) {
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r || CONFIG.BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    Player.draw(ctx, unleash, piColorIdx);
    try { Particles.draw(ctx); } catch(e) { /* never let particle error kill the loop */ }

    // HUD
    UI.drawHUD(ctx, score, level, combo, Player.getHP(), Player.getMaxHP(), unleash);

    // Spawn timer
    spawnTimer++;
    if (spawnTimer >= CONFIG.ENEMY_SPAWN_RATE - Math.min(60, level * 3)) {
      spawnTimer = 0;
      spawnWave();
    }

    // Death check
    if (Player.isDead()) {
      state = 'gameover';
      screenShake(15);
    }

    ctx.restore();
  }

  return { init };
})();

window.addEventListener('load', Game.init);
