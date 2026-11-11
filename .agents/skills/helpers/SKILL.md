---
name: helpers
description: The reusable helpers of this repo: utilities, shared code, the UI kit and the store. Use before writing a new helper, utility or shared component, and when something generic seems to be missing: look here first.
---

# Reusable helpers

Check before writing one. When you add a helper, add it here.

In `src/devtools-panel/utils/` and `src/shared/`:

- helper: `mapObject`, `fromJson`, `isNonNullish`
- responsive: `createElementWidth`, `createGetBreakpoint` (`sm|md|lg`, not Tailwind's)
- perf: `whenIdle`
- memo equals: `sameItems`, `sameFlags`, `createStablePath`
- optimistic: `createOptimisticWithTimeout`
- paths: `pathKey`, `pathEquals`, `pathStartsWith`, `sortPaths`
- state values: `json-safe` (`getJsonType`, `getContainerKeys`, `getKeyLabel`)
- persistence: `createPersistedSignal` (`ui/util/persistedValue.ts`)
- virtual lists: `createVirtualizer`, `createVirtualList` (see the `solid` skill)

Elsewhere:

- state editing: `isInsideSet` (`views/State/Inspector/logic/edit-status.ts`)
- store: `src/devtools-panel/store/` (state, settings, locks)
- ui: `src/devtools-panel/ui/` (`inputs/`, `display/`, `util/` with dialogs, context menu and `btnClass`, `code/` with the passage editor)
