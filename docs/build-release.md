# Build & Release

## Build

```bash
pnpm build
```

Artifacts land in `dist/`:

- `manifest.json`
- `content-script.js`
- `devtools-panel.js`
- `create-panel.html` + `create-panel.js`
- `index.html` (panel root) and styles

## Local Dev Tips

- Use a Twine game tab (SugarCube or Harlowe).
- Open DevTools → **Twine Dugger** panel.
- If the panel disconnects (page refresh, etc.), re-open DevTools to reinitialize.

## Packaging

- Zip the `dist/` folder for store upload or distribution.
- Ensure version bump in `package.json` and `dist/manifest.json`.
