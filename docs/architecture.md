# Architecture Overview

The extension has three main parts:

1. **DevTools Panel UI** (`src/devtools-panel`)
   - SolidJS app rendered into a custom DevTools panel.
   - Talks to the inspected page using `chrome.scripting.executeScript` (see `utils/remote-execute.ts`).
   - Displays game **state**, **diff history**, and **metadata**; allows editing state paths.

2. **Content Script** (`src/content-script`)
   - Injected **on demand** into the inspected tab (not auto-run).
   - Detects the **Twine format** (SugarCube or Harlowe) via `format-helpers/*` and exposes a stable API on `window.TwineDugger`.
   - Produces sanitized snapshots and **diff frames** between consecutive states.

3. **Format Helpers** (`src/content-script/format-helpers`)
   - **SugarCube** and **Harlowe** specific adapters that normalize how to **get state**, **get current passage**, and **mutate** state.
   - Share common operations (set/delete/duplicate keys) in `shared.ts` and use **zod** schemas to validate detection.

### High-Level Data Flow

```
DevTools Panel  ──► (chrome.scripting.executeScript) ──►  Content Script
     ▲                                                         │
     │◄─ JSON (state, diffs, passage) ◄─ window.TwineDugger ◄──┘
```

- Panel calls functions (e.g., `getState`, `getDiffs`, `setState`) by executing code in the page context.
- The content script keeps the last seen state in memory to produce diffs.
- Values are serialized with custom `jsonReplacer`/`jsonReviver` to handle Maps/Sets/functions safely.

### Project Layout (selected)

- `src/create-panel/` — registers the DevTools panel (`create-panel.ts`).
- `src/devtools-panel/` — SolidJS UI, components, stores, and `utils/` (API bridge).
- `src/content-script/` — Twine detection, diff engine, and safe state ops.
- `src/shared/` — cross-bundle utilities and **type definitions** used by both sides.
- `dist/` — built artifacts and `manifest.json`.
