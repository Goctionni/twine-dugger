# Content Script & Twine Integration

The content script (`src/content-script/content-script.ts`) detects the active Twine engine and exposes:

```ts
window.TwineDugger = {
  utils: { jsonReplacer, jsonReviver },
  getState: () => ({ passage, state }),
  getDiffs: () => ({ passage, diffs }),
  setState: (path, value) => void,
  deleteFromState: (path) => void,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) => void,
}
```

- **Detection**: `format-helpers/sugarcube.ts` and `format-helpers/harlowe.ts` use `zod` schemas to confirm the engine.
- **Sanitization**: Harlowe variables are sanitized (filters out transient/unsafe keys).
- **Paths**: A `Path` is an array of segments (`string | number`) referring to nested values.
- **Safety**: Mutations operate on the live Twine state objects provided by the engine.

### Adding a New Twine Format
1. Create a new helper in `format-helpers/<format>.ts` that implements `FormatHelpers`.
2. Implement `detect`, `getState(sanitized?: boolean)`, `getPassage`, and state mutation helpers.
3. Add the helper to `formatHelpers` array in `content-script.ts`.
