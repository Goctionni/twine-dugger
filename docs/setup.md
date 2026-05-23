# Setup

## Prerequisites

- **vite-plus** (Toolchain manager)
- **pnpm** (package manager)
- **Node.js** 24
- Chrome 135+ (build target)

## Install & build

```bash
vp i
vp build
```

This runs the `vite` build, emitting artifacts to `dist/`.

## Load the extension in Chrome

1. Open `chrome://extensions`.
2. Toggle **Developer mode**.
3. Click **Load unpacked** and select the project **`dist/`** folder.
4. Open DevTools on a Twine game page; a panel named **Twine Dugger** appears.
