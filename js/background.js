// background.js — 4-layer parallax (stars, nebula, planets, comets), scrolls DOWNWARD

const Background = (() => {
  let stars = [], nebulae = [], planets = [], comets = [];
  let mouseX = 0, mouseY = 0;
  let W = 0, H = 0;

  function init(w, h) {
    W = w; H = h;
    // Stars
    stars = Array.from({length: 180}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.4 + 0.1,
      alpha: Math.random() * 0.6 + 0.3,
    }));
    // Nebula blobs — pre-render to offscreen canvas so draw() just blits
    nebulae = Array.from({length: 8}, () => {
      const r = Math.random() * 120 + 60;
      const hue = Math.random() * 360;
      const size = Math.ceil(r * 2);
      const oc = document.createElement('canvas');
      oc.width = size; oc.height = size;
      const octx = oc.getContext('2d');
      const grad = octx.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, `hsla(${hue},60%,30%,0.18)`);
      grad.addColorStop(1, 'transparent');
      octx.fillStyle = grad;
      octx.fillRect(0, 0, size, size);
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r,
        speed: Math.random() * 0.2 + 0.1,
        hue,
        offscreen: oc,
      };
    });
    // Planets — mix far (small/dim) and near (large/bright)
    planets = Array.from({length: 5}, (_, i) => {
      const far = i < 3;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: far ? Math.random() * 20 + 20 : Math.random() * 40 + 60,
        speed: far ? Math.random() * 0.15 + 0.05 : Math.random() * 0.6 + 0.3,
        alpha: far ? 0.3 + Math.random() * 0.2 : 0.7 + Math.random() * 0.3,
        hue: Math.random() * 360,
        far,
      };
    });
    // Comets
    comets = [];
    spawnComet();
  }

  function spawnComet() {
    comets.push({
      x: Math.random() * W,
      y: -20,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 5 + 4,
      len: Math.random() * 80 + 40,
      alpha: Math.random() * 0.5 + 0.3,
    });
  }

  function setMouse(x, y) { mouseX = x; mouseY = y; }
  function resize(w, h) { W = w; H = h; init(w, h); }

  function update() {
    const mx = (mouseX / W - 0.5);
    const my = (mouseY / H - 0.5);

    for (const s of stars) {
      s.y += s.speed;
      s.x += mx * s.speed * 0.3;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }
    for (const n of nebulae) {
      n.y += n.speed;
      if (n.y - n.r > H) { n.y = -n.r; n.x = Math.random() * W; }
    }
    for (const p of planets) {
      p.y += p.speed;
      p.x += mx * p.speed * 0.5;
      if (p.y - p.r > H) { p.y = -p.r; p.x = Math.random() * W; }
    }
    for (const c of comets) {
      c.x += c.vx;
      c.y += c.vy;
    }
    comets = comets.filter(c => c.y < H + 100);
    if (Math.random() < 0.003) spawnComet();
  }

  function draw(ctx) {
    ctx.fillStyle = CONFIG.BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    // Nebulae — blit from pre-rendered offscreen canvases (no gradient creation each frame)
    for (const n of nebulae) {
      if (n.offscreen) {
        ctx.globalAlpha = 0.7;
        ctx.drawImage(n.offscreen, n.x - n.r, n.y - n.r);
      }
    }

    // Stars — group into alpha buckets to minimize state changes
    ctx.fillStyle = '#FFFFFF';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Far planets
    for (const p of planets.filter(p => p.far)) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsl(${p.hue},40%,40%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Near planets
    for (const p of planets.filter(p => !p.far)) {
      ctx.globalAlpha = p.alpha;
      const grad = ctx.createRadialGradient(p.x - p.r*0.3, p.y - p.r*0.3, p.r*0.1, p.x, p.y, p.r);
      grad.addColorStop(0, `hsl(${p.hue},60%,70%)`);
      grad.addColorStop(1, `hsl(${p.hue},40%,20%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Comets
    for (const c of comets) {
      ctx.globalAlpha = c.alpha;
      const grad = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * c.len/c.vy, c.y - c.len);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - c.vx * c.len/c.vy, c.y - c.len);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  return { init, update, draw, setMouse, resize };
})();
