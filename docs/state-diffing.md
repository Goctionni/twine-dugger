# State Diffing Model

Diffing uses [`jsondiffpatch`](https://github.com/benjamine/jsondiffpatch); there is no custom diff engine.

## Content script

`createUpdateTracker` (`src/content-script/util/update-tracker.ts`) keeps the last seen state and, on each
`getUpdates()`, returns a **delta** between it and the live state.

- The live state is first made JSON-safe by `pre-transform.ts`: Maps become objects tagged with
  `TYPE_KEY`, Sets become arrays whose first item is `SET_MARKER`, functions and Dates become marker
  objects, and engine-internal `TwineScript_*` values are dropped. See `src/shared/json-safe.ts`.
- Array items are matched by identity (`$$ref:`, `$$id:`, `$$index:` hashes), so reordering and
  insertion show up as moves/adds instead of rewrites.
- The delta is in jsondiffpatch's format: `[new]` add, `[old, new]` change, `[old, 0, 0]` delete,
  `_t: 'a'` arrays, `['', to, 3]` moves.

## Devtools panel

- `store/game-state.ts` holds the current state in a Solid store. Each update is patched onto it and
  kept as a history frame (newest first, sequential ids, `0` = initial state). Older states are
  rebuilt by `unpatch`ing, which is what history navigation shows.
- `store/diff.ts` (`getDiffFromDelta`) flattens a delta into add/del/chg/typ/mov changes for the diff
  log. It is computed lazily per frame.
- When the game reloads, history is kept but marked **tainted** (shown dimmed in the diff log, hidden
  from history navigation).

`getUpdates()` returns `{ passage, delta, reverts, initialized }`; `initialized` is true the first time
after the content script (re)starts, which is how the panel notices a reload.
