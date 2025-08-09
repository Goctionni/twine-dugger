# State Diffing Model

The diff engine (`src/content-script/util/differ.ts`) computes changes between **last** and **current** state:

- Supports primitives, arrays, objects, Maps, Sets, and functions (functions treated as equal when both are functions).
- Uses identity hints from `getPotentialId` to match array/object entries when possible.
- Emits a list of **Diff** items with types like:
  - `add` / `remove` / `update`
  - `type-changed`
  - `map-*`, `set-*` for Map/Set operations
  - Primitive updates: `{ type: 'string' | 'number' | 'boolean', path, oldValue, newValue }`

The content script caches **lastState** and exposes `getDiffs()` which returns `{ passage, diffs }` and updates the cache.

See shared types in `src/shared/shared-types.ts` for the full `Diff`, `Path`, `Value` model.
