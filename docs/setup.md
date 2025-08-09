# Setup

## Prerequisites
- **pnpm** (package manager)
- **Node.js** LTS
- Chrome 135+ (build target)

## Install & build
```bash
pnpm i
pnpm build
```
This runs the `tsdown` build, emitting artifacts to `dist/`.

## Load the extension in Chrome
1. Open `chrome://extensions`.
2. Toggle **Developer mode**.
3. Click **Load unpacked** and select the project **`dist/`** folder.
4. Open DevTools on a Twine game page; a panel named **Twine Dugger** appears.

Manifest snapshot:
- Manifest v3 — **Twine Dugger 0.2.0**
- Permissions: `scripting`, `activeTab`
- Web accessible: `content-script.js`
- DevTools page: `create-panel.html`
