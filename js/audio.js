// audio.js — Web Audio API procedural sounds, no external files

const Audio = (() => {
  let ctx = null;

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function laser() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    o.start(); o.stop(ctx.currentTime + 0.08);
  }

  function explosion(size = 1) {
    if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/d.length, 2);
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    s.buffer = buf; s.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3 * size, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    s.start();
  }

  function hit() {
    if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i/d.length);
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    s.buffer = buf; s.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    s.start();
  }

  function powerup() {
    if (!ctx) return;
    [440, 550, 660, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.07 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.15);
      o.start(ctx.currentTime + i * 0.07);
      o.stop(ctx.currentTime + i * 0.07 + 0.15);
    });
  }

  function unleash() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 55;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5);
    o.start(); o.stop(ctx.currentTime + 5);
  }

  function bossAlarm() {
    if (!ctx) return;
    [220, 180, 220, 180].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.18);
      o.start(ctx.currentTime + i * 0.2);
      o.stop(ctx.currentTime + i * 0.2 + 0.18);
    });
  }

  // Ambient hum
  let ambientNode = null;
  function startAmbient() {
    if (!ctx || ambientNode) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 40;
    o.connect(g); g.connect(ctx.destination);
    g.gain.value = 0.03;
    o.start();
    ambientNode = o;
  }

  return { init, resume, laser, explosion, hit, powerup, unleash, bossAlarm, startAmbient };
})();
