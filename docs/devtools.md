# DevTools Panel

The DevTools app (`src/devtools-panel`) renders the main UI (`views/`):

- **State View**: Inspect nested state (objects, arrays, Maps, Sets). Edit primitives in-place;
  add/duplicate/delete keys; lock a property to its current value.
- **Diff Log**: Stream of **diff frames**; each frame shows granular changes and writes blocked by locks.
  After a game reload, earlier frames stay visible but dimmed ("tainted").
- **History Navigation**: Jump between frames to inspect prior states.
- **Passages**: List, view and edit passages.
- **Search**: Search state (keys and values) and passages. Runs in time slices so typing stays responsive.
- **Settings**: Font size, filtered paths, locks. Per-game config (locks, filtered paths) is stored in
  `localStorage` under `twine-dugger-<ifId>`.

## Store

Solid 2 store, split by concern in `src/devtools-panel/store/`: `store.ts` (connection, navigation,
view state, settings), `game-state.ts` (state, history, derived diff frames), `locks.ts`, `passages.ts`,
`tracking.ts` (polling the content script), `diff.ts` (delta → changes).

### Panel ↔ Page Bridge

All requests go through `api/api.ts`, which depends on:

- `api/remote-execute.ts` — wraps `chrome.scripting.executeScript` (or CDP) for the inspected tab.
- `api/remote-functions/*` — small lambdas serialized and executed in the page context.
- `injectContentScript()` — ensures `content-script.js` is present before calling `window.TwineDugger`.

Error handling keeps the panel responsive if the inspected page reloads or the extension gets killed; re-open DevTools to reinit.
