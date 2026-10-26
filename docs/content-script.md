# Content Script & Twine Integration

The content script (`src/content-script/content-script.ts`) detects the active Twine engine and exposes
`window.TwineDugger`, which the panel calls through the page bridge:

- `getUpdates()` — the full JSON-safe state the first time it is asked (or when full is passed), and the delta since the last call after that
  (see [`state-diffing.md`](./state-diffing.md)).
- `setState`, `deleteFromState`, `duplicateStateProperty` — modify the live state by path.
- `setStateMulti` — writes and deletes several paths in one go, between two polls, so the game and the diff log see one change. A write that fails does not stop the others.
- `setStatePropertyLocks` — keep properties at a fixed value; writes to them are undone and reported.
- `getPassageData`, `goToPassage`, `setPassage` — read, open and update passages.

- **Detection**: `format-helpers/[format].ts` uses `arktype` schemas to confirm the engine.
- **Transforms**: `util/pre-transform.ts` converts engine state to JSON-safe values (Maps, Sets, Dates (one string, to the second),
  functions, NaN, the infinities and undefined are marked values) and `util/post-transform.ts`
  converts values from the panel back.
- **Paths**: A `Path` is an array of segments (`string | number`) referring to nested values.
- **Safety**: Mutations operate on the live Twine state objects provided by the engine.

### Adding a New Twine Format

1. Create a new helper in `format-helpers/<format>.ts` that implements `FormatHelpers` (`type.ts`).
2. Add the helper to the `formatHelpers` array in `content-script.ts`.

## A SugarCube game that has blocked access to its API

Some games take `window.SugarCube` out of the page. `getGameMetaFn` then finds the page of SugarCube (the script `script-sugarcube`, or `#ui-bar` and `#passages`) but not the engine, and the panel says "This game has blocked access to the SugarCube API" (`app/ApiBlocked.tsx`). TwineDugger does not try to get around it.
