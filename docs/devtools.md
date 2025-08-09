# DevTools Panel

The DevTools app (`src/devtools-panel`) renders the main UI:

- **State View**: Inspect nested state (objects, arrays, Maps, Sets). Edit primitives in-place; add/duplicate/delete keys in objects/arrays.
- **Diff Log**: Stream of **diff frames** since the panel loaded; each frame shows granular operations (add/update/delete type-changes).
- **History Navigation**: Jump between frames to inspect prior state snapshots.
- **Metadata**: Current passage, story format, and other high-level info (from `getMetaData` remote fn).

### Panel ↔ Page Bridge

All requests go through `utils/api.ts`, which depends on:
- `utils/remote-execute.ts` — wraps `chrome.scripting.executeScript` for the inspected tab.
- `utils/remote-functions/*` — small lambdas serialized and executed in the page context.
- `injectContentScript()` — ensures `content-script.js` is present before calling `window.TwineDugger`.

Error handling keeps the panel responsive if the inspected page reloads or the extension gets killed; re-open DevTools to reinit.
