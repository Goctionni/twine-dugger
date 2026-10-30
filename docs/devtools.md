# DevTools Panel

The DevTools app (`src/devtools-panel`) renders the main UI (`views/`):

- **State page**: Move through the state (objects, arrays, Maps, Sets) with Miller columns, a tree or tiles, filter and sort it, and edit it in an inspector: values, containers (in bulk, or as JSON), previous values, pins and locks. See [`state/`](./state/README.md).
- **Diff Log**: Stream of **diff frames**, each showing the changes between two states.
- **Passages**: List, view and edit passages.
- **Search**: Search state and passages, with match case, whole word and regex, and filters (what to search in, state type, passage tag) and sorting. Which options are remembered is set in Settings. See [`search/`](./search/README.md).
- **Settings**: Options of each page, the lists of filtered paths and locked variables. Settings are stored in `localStorage`, filtered paths, locks and pins per game.

State lives in a Solid store (`store/`), updated by polling the content script.

### Panel ↔ Page Bridge

All requests go through `api/api.ts`, which depends on:

- `api/remote-execute.ts` — wraps `chrome.scripting.executeScript` for the inspected tab.
- `api/remote-functions/*` — small lambdas serialized and executed in the page context.
- `injectContentScript()` — ensures `content-script.js` is present before calling `window.TwineDugger`.

Error handling keeps the panel responsive if the inspected page reloads or the extension gets killed; re-open DevTools to reinit.
