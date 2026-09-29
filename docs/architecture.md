# Architecture Overview

The extension has three main parts:

1. **DevTools Panel UI** (`src/devtools-panel`)
   - SolidJS app rendered into a custom DevTools panel.
   - Talks to the inspected page using `chrome.scripting.executeScript` (see `api/remote-execute.ts`).
   - Displays game **state**, **diff history**, passages and search; allows editing and locking state paths.

2. **Content Script** (`src/content-script`)
   - Injected **on demand** into the inspected tab (not auto-run).
   - Detects the **Twine format** (SugarCube, Harlowe, Chapbook or Snowman) via `format-helpers/*` and exposes a stable API on `window.TwineDugger`.
   - Produces JSON-safe snapshots and jsondiffpatch **deltas** between consecutive states, and enforces property locks.

3. **Format Helpers** (`src/content-script/format-helpers`)
   - Story-format specific adapters that normalize how to
     - get state
     - set state
     - get current passage
     - get passage list
     - navigate to passage
     - update a passage's code
   - Share common operations (set/delete/duplicate keys) in `shared.ts` and use **arktype** schemas to validate detection.

### High-Level Data Flow

```
DevTools Panel  ──► (chrome.scripting.executeScript) ──►  Content Script
     ▲                                                         │
     │◄─ JSON (state, diffs, passage) ◄─ window.TwineDugger ◄──┘
```

- Panel calls functions (e.g., `getState`, `getUpdates`, `setState`) by executing code in the page context.
- The content script keeps the last seen state in memory to produce deltas.
- State is made JSON-safe (Maps, Sets, functions and Dates as marked values, see `src/shared/json-safe.ts`) so it survives the trip.

### Project Layout (selected)

- `src/create-panel/` — registers the DevTools panel (`create-panel.ts`).
- `src/devtools-panel/` — SolidJS UI, views, store, and `api/` (page bridge).
- `src/content-script/` — Twine detection, delta tracking, locks, and safe state ops.
- `src/shared/` — cross-bundle utilities and **type definitions** used by both sides.
- `dist/` — built artifacts and `manifest.json`.
