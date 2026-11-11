# Twine Dugger

Chrome/Firefox DevTools extension to inspect and edit the state of Twine games (SugarCube, Harlowe, Chapbook, Snowman). Architecture and contributor docs are in `docs/` (start with `docs/architecture.md`).

## Stack

SolidJS 2.0 RC (`solid-js`, `@solidjs/web`), Tailwind 4, arktype, vite-plus (`vp`), oxlint and oxfmt, vitest through `vite-plus/test`, changesets. `@/` is an alias for `src/`.

Solid 2 differs a lot from 1.x and from most training data. Before writing Solid code, read `node_modules/solid-js/skills/solid-2.0/SKILL.md`; look up exact API forms in `node_modules/solid-js/CHEATSHEET.md`; when a `[CODE]` dev warning shows up, read `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`. How this repo uses Solid (lists, virtual lists, effects, slow updates): `.agents/skills/solid/SKILL.md`.

## `vp` / `npx vp`

Commands below are written as `vp ...`. If `vp` is not installed globally, use `npx vp ...`.

## Verify changes

```bash
vp fmt src
vp check
vp test run
```

`vp check` runs lint, format and types, with warnings denied. Tests run in shuffled order, so they must not depend on each other.

## Vite+ (`vp`)

- Use `vp` commands, not `vite`, `vitest`, `oxlint` or `oxfmt` directly; import test APIs from `vite-plus/test`. Config lives in `vite.config.ts`, `vitest.config.ts` and `oxlint.config.ts` / `oxfmt.config.ts`.
- `vp <name>` is a built-in command; `vp run <name>` runs a `package.json` script or `vite.config.ts` task (`vp run package`). A script cannot override a built-in, so `vp dev` and `vp run dev` may differ.
- `vpx <file>` runs a TypeScript file or a package binary directly; `vp node <file>` runs plain Node.
- Run `vp install` after pulling. Docs are local in `node_modules/vite-plus/docs/` (also https://viteplus.dev/guide/); `vp <command> --help` lists flags.

## Code conventions

- Few abstractions: explicit JSX over data-driven rendering, no constants for a value used once, no files that only re-export.
- Comments explain why, next to the line that needs it. Do not write comments that say what the code does.
- Pass values, not accessors, as props. Prefer props over context when there are one or two consumers. Keep state next to the component that uses it.
- Use plain TypeScript types for internal data; arktype only to validate external input (localStorage, messages).
- Names are specific (`searchText`, not `text`); reviewers grep for them.
- Solid `class`: use the object form for conditions (`class={['base', { 'text-red-400': isRed() }]}`). Handlers longer than a line or two are named functions above the JSX.
- Use `Switch` with two `Match`es for an if/else, not `<Show fallback>`.
- Before changing how state is read, diffed or written (markers, Maps and Sets, locks), read `docs/state-transfer.md`.

## Working style

- Work in small, reviewable steps and explain each one. Discuss the design before changing it.
- When asked for several things, do them one at a time and say after each what remains.
- Do only what was asked, especially for visual changes.
- Give a recommendation rather than a survey of options, and say plainly what could not be verified.
