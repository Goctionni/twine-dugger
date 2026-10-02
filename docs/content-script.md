# Content Script & Twine Integration

The content script (`src/content-script/content-script.ts`) detects the active Twine engine and exposes:

```ts
window.TwineDugger = {
  getState: () => ({ passage, state }),
  getUpdates: () => ({ passage, delta, reverts, initialized }),
  setState: (path, value) => void,
  deleteFromState: (path) => void,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) => void,
  setStatePropertyLocks: (locks) => void,
  getPassageData: () => PassageData[],
  goToPassage: (name) => void,
  setPassage: (passage) => void,
}
```

- **Detection**: `format-helpers/[format].ts` uses `arktype` schemas to confirm the engine.
- **Transform**: `util/pre-transform.ts` makes the live state JSON-safe (Maps, Sets, functions, Dates;
  filters `TwineScript_*` internals). `util/post-transform.ts` reverses that for values sent back in.
- **Updates**: `util/update-tracker.ts` produces the jsondiffpatch delta, see [`state-diffing.md`](./state-diffing.md).
- **Locks**: the panel sends `{ path, value }` locks. On every `getUpdates()`, `util/locks.ts` restores
  locked values in the live state _before_ diffing and reports the attempted writes as `reverts`.
  Locks on paths that no longer exist are ignored until they exist again, and repeats of the same
  blocked value are only reported once.
- **Paths**: A `Path` is an array of segments (`string | number`) referring to nested values.
- **Safety**: Mutations operate on the live Twine state objects provided by the engine.

### Adding a New Twine Format

1. Create a new helper in `format-helpers/<format>.ts` that implements `FormatHelpers` (`type.ts`):
   `detect`, `getState`, `getPassage`, `setState`, `deleteFromState`, `duplicateStateProperty`,
   `goToPassage`, `setPassage`, and optionally `getPassageData`.
2. Add the helper to the `formatHelpers` array in `content-script.ts`.
