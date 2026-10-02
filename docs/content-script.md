# Content Script & Twine Integration

The content script (`src/content-script/content-script.ts`) detects the active Twine engine and exposes
`window.TwineDugger`, which the panel calls through the page bridge:

- `getState()` / `getUpdates()` — a JSON-safe snapshot of the state, and the delta since the last call
  (see [`state-diffing.md`](./state-diffing.md)).
- `setState`, `deleteFromState`, `duplicateStateProperty` — modify the live state by path.
- `setStatePropertyLocks` — keep properties at a fixed value; writes to them are undone and reported.
- `getPassageData`, `goToPassage`, `setPassage` — read, open and update passages.

- **Detection**: `format-helpers/[format].ts` uses `arktype` schemas to confirm the engine.
- **Transforms**: `util/pre-transform.ts` converts engine state to JSON-safe values and
  `util/post-transform.ts` converts values from the panel back.
- **Paths**: A `Path` is an array of segments (`string | number`) referring to nested values.
- **Safety**: Mutations operate on the live Twine state objects provided by the engine.

### Adding a New Twine Format

1. Create a new helper in `format-helpers/<format>.ts` that implements `FormatHelpers` (`type.ts`).
2. Add the helper to the `formatHelpers` array in `content-script.ts`.
