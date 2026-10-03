# DevTools Panel

The DevTools app (`src/devtools-panel`) renders the main UI (`views/`):

- **State View**: Inspect nested state (objects, arrays, Maps, Sets). Edit primitives in-place;
  add/duplicate/delete keys; lock properties.
- **Diff Log**: Stream of **diff frames**, each showing the changes between two states.
- **History Navigation**: Jump between frames to inspect prior states.
- **Passages**: List, view and edit passages.
- **Search**: Search state and passages.
- **Settings**: Display options, filtered paths and locks. Per-game settings are stored in `localStorage`.

State lives in a Solid store (`store/`), updated by polling the content script.

### Panel ↔ Page Bridge

All requests go through `api/api.ts`, which depends on:

- `api/remote-execute.ts` — wraps `chrome.scripting.executeScript` for the inspected tab.
- `api/remote-functions/*` — small lambdas serialized and executed in the page context.
- `injectContentScript()` — ensures `content-script.js` is present before calling `window.TwineDugger`.

Error handling keeps the panel responsive if the inspected page reloads or the extension gets killed; re-open DevTools to reinit.
