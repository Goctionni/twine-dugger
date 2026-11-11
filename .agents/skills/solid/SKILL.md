---
name: solid
description: How this repo uses Solid, beyond the Solid 2 API. Use when writing or reviewing lists, virtualized lists, per-row state, or effects that reset when something changes. The general Solid 2 rules, and the repair for each warning code, are in the shipped skills in `node_modules/solid-js/skills`; read those first.
---

# Solid in this repo

Read `node_modules/solid-js/skills/solid-2.0/SKILL.md` first. `reactivity-diagnostics` there also explains list identity, fan-out, effect relays and how to measure them. This is only what is specific to this repo.

## Lists

- Rows that must survive a replaced source (search hits, rows derived from the state) are loaded through `createProjection(() => source, [], { key: 'key' })`, see `views/GlobalSearch/subcomponents/ResultList.tsx`. Other lists use `keyed={(entry) => entry.id}` (`HistoryTab.tsx`) or `keyed={false}`.
- Per-row state is a store keyed by id: `lastChanged` in `store/game-state.ts` (`getLastChangeId(path)`). Not a signal every row reads, and not a value derived from the update counter, which changes on every poll.

## Virtual lists

- Use `createVirtualizer` (`utils/create-virtualizer.ts`), the Solid 2 adapter for TanStack Virtual, not the library directly. `reconcileBy: 'index'` (default) keeps the item at a position; `'key'` keeps an item that moves, and then `getItemKey` must be a getter that reads the list, because the virtualizer only looks again when its options change.
- The State lists use `createVirtualList` with `<VirtualItems>` (`views/State/Navigators/Shared/`): keys in order, the selected index, and kept keys (an item with focus stays in the DOM).
- jsdom has no layout: see the `vitest` skill.

## Derived values and effects

- A path that must only change when its content does: `createStablePath`. For memos that return arrays, `equals: sameItems` (`utils/same-items.ts`).
- To reset a value when something changes, read the dependency in the initial function (`createSignal(() => { getStablePath(); return false; })`) and put the comment on that read. See `EditAsJson/create-edit-as-json.ts` and `HistoryTab.tsx`.

## Measuring

Measure the production build. The dev build with attribution enabled distorts timings, so use it to find what runs, not how long it takes.

## Helpers

Before writing a utility, check the `helpers` skill (`.agents/skills/helpers/SKILL.md`): it lists what already exists, including the helpers used above.
