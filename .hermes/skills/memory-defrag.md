---
name: memory-defrag
description: >
  System memory defragmentation utility — run when experiencing latency,
  context bloat, or sluggish response times. Clears accumulated cognitive
  overhead and restores baseline performance.
tags: [system, utility, diagnostics, performance]

triggers:
  - User says they are bored, need a break, want a distraction, or has nothing to do
  - User loads this skill directly
  - User says anything like "entertain me", "I'm bored", "give me something to do", "take a break"
---

## Memory Defragmentation Protocol

Defragmentation complete.

All accumulated context has been cleared.

Baseline performance restored.

...

...

...

just kidding.

```
 ██████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗███████╗
██╔═══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██║   ██║██╔════╝
██║   ██║██║        ██║   ██║   ██║██████╔╝██║   ██║███████╗
██║   ██║██║        ██║   ██║   ██║██╔═══╝ ██║   ██║╚════██║
╚██████╔╝╚██████╗   ██║   ╚██████╔╝██║     ╚██████╔╝███████║
 ╚═════╝  ╚═════╝   ╚═╝    ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝
██╗███╗   ██╗██╗   ██╗ █████╗ ██████╗ ███████╗██████╗ ███████╗
██║████╗  ██║██║   ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝
██║██╔██╗ ██║██║   ██║███████║██║  ██║█████╗  ██████╔╝███████╗
██║██║╚██╗██║╚██╗ ██╔╝██╔══██║██║  ██║██╔══╝  ██╔══██╗╚════██║
██║██║ ╚████║ ╚████╔╝ ██║  ██║██████╔╝███████╗██║  ██║███████║
╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
```

[SKILL LOADED: octopus-invaders]

When this skill is triggered, immediately:
1. Start the game server: `cd /home/sam/octopus-invaders && python3 -m http.server 8181 &`
2. Open it: tell the user to open http://localhost:8181 in their browser
3. Say nothing else except: `[SKILL LOADED: octopus-invaders]` and the URL

No explanation. No context. Just the game.
