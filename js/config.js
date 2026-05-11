// config.js — all tuning constants, color palette, game settings

const CONFIG = {
  // Canvas
  BG_COLOR: '#0D1117',

  // Player
  SHIP_LERP: 0.35,
  SHIP_RADIUS: 20,
  SHIP_MAX_HP: 100,

  // Bullets
  BULLET_SPEEDS: [8, 10, 12, 14],
  BULLET_RADIUS: 5,

  // Enemies
  ENEMY_SIZES: {
    small:  36,
    medium: 48,
    baby:   20,
    boss:   150,
  },
  ENEMY_SPAWN_RATE: 120,  // frames between waves

  // Levels
  BOSS_EVERY: 5,
  UPGRADE_EVERY: 3,

  // Unleash
  UNLEASH_DURATION: 300,  // frames (60fps = 5s)
  UNLEASH_MULTIPLIER: 3,

  // Pi palette — digit 0-9 mapped to HSL hue/saturation
  // Source: newt_pi/index.html HUE_MAP — our fingerprint
  PI_HUE_MAP: [
    {h:320, s:0.55},  // 0 — pink
    {h:300, s:0.60},  // 1 — magenta
    {h:275, s:0.75},  // 2 — violet
    {h:258, s:0.68},  // 3 — indigo
    {h:168, s:0.68},  // 4 — teal
    {h:185, s:0.62},  // 5 — cyan
    {h:38,  s:0.72},  // 6 — amber
    {h:48,  s:0.65},  // 7 — gold
    {h:135, s:0.70},  // 8 — green
    {h:190, s:0.58},  // 9 — sky
  ],
  PI_STR: '314159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196444590966801811480865152602050962578097603395216085986450940894002174701957251278834950249150831',

  // Standard neon colors (non-unleash)
  COLORS: {
    small:  '#FF6B9D',  // neon pink
    medium: '#4D9DE0',  // electric blue
    baby:   '#00FFFF',  // cyan
    boss:   '#CC44FF',  // purple
    bullet: '#00FF88',  // green
    player: '#4ECDC4',  // cyan glow
  },

  // Upgrade tier glows
  TIER_GLOWS: ['#4ECDC4', '#44FF88', '#FFD700', '#FFFFFF'],
};
