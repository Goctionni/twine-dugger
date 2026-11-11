# Content Script & Twine Integration

The content script (`src/content-script/content-script.ts`) detects the active Twine engine and exposes
`window.TwineDugger`, which the panel calls through the page bridge:

- `getUpdates()` — the full JSON-safe state the first time it is asked (or when full is passed), and the delta since the last call after that
  (see [`state-diffing.md`](./state-diffing.md)).
- `setStateMulti` — writes and deletes values by path, several in one go (the panel's `setState` and `deleteFromState` call it).
- `duplicateStateProperty` — copies a property to a new key in its parent.
- `setStatePropertyLocks` — keep properties at a fixed value; writes to them are undone and reported.
- `getPassageData`, `goToPassage`, `setPassage` — read, open and update passages.

- **Detection**: `format-helpers/[format].ts` uses `arktype` schemas to confirm the engine.
- **Transforms**: `util/pre-transform.ts` converts gamestate to JSON-safe values (Maps, Sets, Dates etc) and `util/post-transform.ts`
  converts values from JSON-safe back to values usable in the gamestate. How and why: [`state-transfer.md`](./state-transfer.md).
- **Paths**: A `Path` is an array of segments (`string | number`) referring to nested values.
- **Safety**: Mutations operate on the live Twine state objects provided by the engine.

### Locks

Locks are enforced on every poll. Locks apply to a path, not to an object reference or identity (see [`compromises-not-bugs.md`](./compromises-not-bugs.md)).

### Adding a New Twine Format

1. Create a new helper in `format-helpers/<format>.ts` that implements `FormatHelpers` (`type.ts`).
2. Add the helper to the `formatHelpers` array in `content-script.ts`.
