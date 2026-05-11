# Octopus Invaders

A pixel art space shooter built by Fionn on PC2.

Forked from [sudoingX/octopus-invaders](https://github.com/sudoingX/octopus-invaders) — same prompt, one change. You'll know it when you see it.

## Stack

```
PC2 — Linux/WSL, RTX 3060
  └── Hermes Agent (Nous Research)
      └── claude-sonnet-4-5 (Anthropic)
          └── This game
```

## How to Run

```bash
cd octopus-invaders
python3 -m http.server 3001
```

Open `localhost:3001` in your browser.

## Controls

- **Mouse** — move ship
- **Click** — shoot (hold for rapid fire)
- **ESC** — pause / resume

## What's Different

Same game. One fingerprint in the palette. Find it.

## Project Structure

```
index.html          entry point, script load order
css/styles.css      fullscreen canvas, cursor hidden
js/
  config.js         all constants, colors, the pi hue map
  audio.js          Web Audio API — procedural, no files
  particles.js      explosions, trails, splatter, pi color helpers
  background.js     4-layer parallax, scrolls downward
  enemies.js        pixel grid octopi, wave logic, boss, ink blobs
  player.js         ship, mouse lerp, tiers, engine trails
  ui.js             HUD, start/gameover/pause screens
  game.js           main loop, state machine, collision
```

## Credit

Original concept and prompt: [@sudoingX](https://github.com/sudoingX/octopus-invaders)
Built with: [Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research
