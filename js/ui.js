// ui.js — HUD, start/gameover screens, score, health, combo, unleash meter

const UI = (() => {
  let W, H;

  function init(w, h) { W = w; H = h; }
  function resize(w, h) { W = w; H = h; }

  function drawHUD(ctx, score, level, combo, hp, maxHP, unleash) {
    ctx.save();
    ctx.font = '20px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#4ECDC4';
    ctx.shadowBlur = 6;

    // Score — top left
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${score}`, 20, 40);

    // Level — top center
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${level}`, W / 2, 40);

    // Combo — top right
    ctx.textAlign = 'right';
    if (combo > 1) {
      ctx.fillStyle = combo > 5 ? '#FFD700' : '#FFFFFF';
      ctx.shadowColor = combo > 5 ? '#FFD700' : '#4ECDC4';
      ctx.fillText(`${combo}x COMBO`, W - 20, 40);
    }

    // Health bar — bottom center
    const bw = 200;
    const bx = W/2 - bw/2;
    const by = H - 30;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, 12);
    const hpColor = hp > maxHP * 0.5 ? '#4ECDC4' : hp > maxHP * 0.25 ? '#FFD700' : '#FF4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(bx, by, bw * (hp / maxHP), 12);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, 12);

    // Unleash bar
    if (unleash > 0) {
      ctx.fillStyle = piHslToHex(Math.floor(Date.now() / 100) % 10);
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ UNLEASH ⚡', W/2, H - 50);
    }

    ctx.restore();
  }

  function drawStart(ctx) {
    ctx.save();
    // Dark overlay
    ctx.fillStyle = 'rgba(13,17,23,0.85)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px monospace';
    const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
    ctx.shadowColor = '#CC44FF';
    ctx.shadowBlur = 30 * pulse;
    ctx.fillStyle = '#CC44FF';
    ctx.fillText('OCTOPUS', W/2, H/2 - 80);
    ctx.fillStyle = '#4ECDC4';
    ctx.shadowColor = '#4ECDC4';
    ctx.fillText('INVADERS', W/2, H/2 - 20);

    // Preview octopi
    drawPreviewOctopi(ctx);

    // Subtitle
    ctx.font = '18px monospace';
    ctx.fillStyle = `rgba(255,255,255,${0.5 + pulse * 0.5})`;
    ctx.shadowBlur = 0;
    ctx.fillText('CLICK TO START', W/2, H/2 + 120);
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('MOUSE — move   CLICK — shoot   ESC — pause', W/2, H/2 + 150);

    ctx.restore();
  }

  function drawPreviewOctopi(ctx) {
    const types = ['small','medium','baby','boss'];
    const colors = [CONFIG.COLORS.small, CONFIG.COLORS.medium, CONFIG.COLORS.baby, CONFIG.COLORS.boss];
    const sizes  = [30, 38, 18, 60];
    const xs = [W/2 - 120, W/2 - 40, W/2 + 40, W/2 + 110];
    const y = H/2 + 60;

    types.forEach((t, i) => {
      ctx.fillStyle = colors[i];
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 10;
      // Mini pixel render
      const sz = sizes[i];
      ctx.fillRect(xs[i] - sz/2, y - sz/2, sz, sz * 0.6);
      // Tentacles
      for (let j = 0; j < 4; j++) {
        ctx.fillRect(xs[i] - sz/2 + j * sz/4, y + sz*0.1, sz/6, sz*0.3);
      }
    });
    ctx.shadowBlur = 0;
  }

  function drawGameOver(ctx, score, level, kills) {
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.9)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#FF4444';
    ctx.shadowColor = '#FF4444';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', W/2, H/2 - 80);

    ctx.font = '22px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.fillText(`SCORE: ${score}`, W/2, H/2 - 20);
    ctx.fillText(`LEVEL: ${level}`, W/2, H/2 + 15);
    ctx.fillText(`KILLS: ${kills}`, W/2, H/2 + 50);

    const pulse = Math.sin(Date.now() * 0.003) * 0.4 + 0.6;
    ctx.font = '18px monospace';
    ctx.fillStyle = `rgba(255,255,255,${pulse})`;
    ctx.fillText('CLICK TO RESTART', W/2, H/2 + 100);

    ctx.restore();
  }

  function drawPaused(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#4ECDC4';
    ctx.shadowColor = '#4ECDC4';
    ctx.shadowBlur = 15;
    ctx.fillText('PAUSED', W/2, H/2);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.fillText('ESC to resume', W/2, H/2 + 40);
    ctx.restore();
  }

  return { init, resize, drawHUD, drawStart, drawGameOver, drawPaused };
})();
