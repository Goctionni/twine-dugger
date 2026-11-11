---
name: vitest
description: Writing, running or debugging unit tests (vitest 5 through vite-plus, jsdom, Solid components). Use when adding or fixing a `*.test.ts(x)`, when a test fails only in jsdom or only in some orders, or when a test needs layout, a browser API or the extension API stubbed. Also for vitest benchmarks and jsdom options.
---

# Tests

Import from `vite-plus/test`. Run `vp test run` (one file: `vp test run path/to/x.test.tsx`). Config: `vitest.config.ts` (jsdom, shuffled order, setup file `src/testing/vitest.setup.ts`). Tests sit next to the code.

## Common failures

- **Random order:** no test may depend on another or on module state it leaves behind (module-level signals); set the state in the test.
- **`console.log` is swallowed:** write debug output to a file and read it; remove it afterwards.
- **No layout in jsdom** (`getBoundingClientRect`, `ResizeObserver`, `requestIdleCallback`, scrolling, `elementFromPoint`): virtual lists use `src/testing/stub-virtual-layout.ts`; anything that depends on real sizes or focus is checked by hand in a browser.
- **No `chrome` global:** components importing the extension api at load need it first: `vi.hoisted(() => { globalThis.chrome = { devtools: {} } })` (see `GlobalSearchView.test.tsx`).
- **jsdom quirks:** same-`name` `details` don't close each other; a dynamic child inside a customizable `<select>` crashes the parser ("reading 'nextSibling'"), so keep it static (see `Toolbar/SortMenu.tsx`); user-event's `clear()` on a controlled number input writes the value back itself.

## Solid

- `render(() => <C />)`, query by role. Writes are staged: `flush()` after events and setters before asserting; use `await resolve(() => v())` for async.
- Never write a signal inside `createRoot(() => ...)` (`[REACTIVE_WRITE_IN_OWNED_SCOPE]`): create it there, write it outside. Primitives outside components: `createRoot(dispose => ...)` and `dispose()`.
- "Did not re-render": count DOM writes with a `MutationObserver`.
- Other `[CODE]` warnings: `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`.

Tests are a cheap regression net: let testability shape the code, but don't export something only for a test (a one-line export of a pure helper is fine).

## References (only when needed)

- `references/benchmarking.md`: the v5 `bench` fixture, for pure logic (matching, diffing), not rendering.
- `references/environments.md`: jsdom options, per-file environment, CSS, `server.deps.inline`.

v5: mock call history is cleared before each test; see `node_modules/vite-plus/docs/guide/vitest-v5.md`.
