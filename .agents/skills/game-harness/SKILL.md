---
name: game-harness
description: Run Twine Dugger in a normal browser window, against a Twine game running in an iframe. Use for visual checks, layout at different widths, or behaviour that needs a real game and the real content script (also the way to drive the panel from a browser automation tool).
---

# Game harness

```bash
vp run iframe "D:/games/my-game" width=400 height=300 mute=on
```

This runs `vp dev . --`; the `gameIframePlugin` vite plugin reads the arguments after `--` from `process.argv`.

- First argument: absolute path of a built game's folder (needs an `index.html`) or of its html file, in quotes, either slash style. URLs are not supported yet.
- `width` and `height` (px, default 480 x 300) set the starting size of the game frame. In the page, drag its header to move it, its corner to resize it, and use the − / % / + buttons to zoom the game only.
- `mute=on` silences the game (default: sound on).
- Without a path, `vp dev` runs the panel against a mocked api instead (see the `browser-extension` skill).

Not covered: the `debugger`/CDP path, and how the real extension injects `content-script.js`. Measure performance on a production build, not on this dev server.

Details: `build/plugin-game-iframe.ts` (server, arguments), `src/devtools-panel/api-iframe/` (frame and transport), the `iframe` script in `package.json`.
