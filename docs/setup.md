# Setup

## Prerequisites

- **vite-plus** (Toolchain manager)
- **pnpm** (package manager)
- **Node.js** 24
- Chrome 145+ or Firefox 150+

## Install & build

```bash
vp i
vp build
```

This builds the extension into `dist/` (Chrome) and `dist-ff/` (Firefox), see [`build-release.md`](./build-release.md).

## Load the extension in Chrome

1. Open `chrome://extensions`.
2. Toggle **Developer mode**.
3. Click **Load unpacked** and select the project **`dist/`** folder.
4. Open DevTools on a Twine game page; a panel named **Twine Dugger** appears.

## Load the extension in Firefox

1. Open `about:debugging` and choose **This Firefox**.
2. Click **Load Temporary Add-on** and select `dist-ff/manifest.json`.
3. Open DevTools on a Twine game page; a panel named **Twine Dugger** appears.

Firefox only keeps a temporary add-on until it restarts, so load it again after restarting Firefox.

## Run the panel in a browser tab

Without the extension, the panel runs in a normal tab with a mocked api:

```bash
vp dev
```

To run it against a real built game, which is shown in a movable, resizable frame in the same tab:

```bash
vp run iframe "D:/games/my-game" width=400 height=300
```

The first argument is the absolute path of the game's folder or its html file (forward or back slashes, in quotes); `width` and `height` (px) are optional.
