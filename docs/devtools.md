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

- `api/remote-execute.ts` — runs a function in the inspected page with `devtools.inspectedWindow.eval`.
- `api/remote-functions/*` — small lambdas serialized and executed in the page context.
- `injectContentScript()` — ensures `content-script.js` is present before calling `window.TwineDugger`.

Everything that crosses this bridge has to survive being turned into JSON, see [`state-transfer.md`](./state-transfer.md).

A reload of the inspected page is picked up by the next poll and starts the state over. After repeated failed polls the panel shows an error instead; re-open DevTools to start again.
