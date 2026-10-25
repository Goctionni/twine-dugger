# State page

The State page shows the game's **state** (the variables of the story) next to the **diff log**, lets you
move through it in three ways, and edits it. This document explains what it does, which parts it is
made of, where the data comes from and how it flows.

All code is in `src/devtools-panel/views/State/` (the page itself is `pages/StatePage.tsx`; the
split between the diff log and the state is `ui/util/movable-split/`). The diff log is described in
[`../devtools.md`](../devtools.md) and the model of its diffs in [`../state-diffing.md`](../state-diffing.md).

## What it does

- **Three ways to navigate**, switched in the toolbar (the choice is a setting):
  - **Miller columns**: one column per level. When there is no room, the oldest columns fold into
    narrow strips.
  - **Tree**: rows you open and close. Either everything is in the tree, or the tree holds only
    containers and the values of the selected container are in a list beside it (Settings > State
    page > Tree layout).
  - **Tiles**: a grid of the values in one container, a tile opens a container.
- **Breadcrumbs** show the path of what is shown and have a menu on each part to jump to a sibling.
- **Toolbar**: the navigator switch, a **filter** (text; matches names and values of what is on
  screen, with the matches highlighted, a Clear button and a message when nothing matches), a
  **type filter** and a **sort** (name, type, recently changed, each also in reverse). Pinned values
  are always first. A container where nothing is left to show has no column, and the counts say how
  many values the filters hide.
- **Inspector** for what is selected. It sits beside the navigator, below it, or over it when the
  space is small (a size container named `frame`, see `inspector-sheet` and `inspector-overlay` in
  `style.css`).
  - **A value** (text, number, true / false) has an editor, a lock (a number can be locked to a
    range with a minimum and a maximum), pin and delete. A **History** tab lists its earlier
    values with Restore, and for numbers a timeline chart; an **Info** tab says what it is, where it
    is and when it last changed.
  - **A container** has a grid of its values with one editor per row, a row above it to edit
    the selected rows together (a value for all of the same type, lock, delete), **Add property**
    (or Add item), **Edit as JSON**, and lock, pin and delete for the container itself. NaN, the
    infinities and undefined are shown, but not written by the panel.
- **Recently changed** values (and the containers around them) have a dot for the last few updates.
- **Keyboard**: arrow keys move in every navigator, and typing letters jumps to the row that starts
  with them (**type-ahead**). Tree: left closes or goes to the parent, right opens or goes to the
  first child. Tiles: arrows move over the grid, Enter opens a container, Backspace, Shift+Up and
  Shift+Left go up.
- **Locks, pins and filters** are per game and kept in `localStorage`. A locked value is put back by
  the content script on every poll; a locked container holds everything in it, and cannot be
  deleted or changed. A **filtered path** (right-click it in the diff log) can be hidden in the diff
  log, on the State page, or both (Settings > Filtered paths and locks).

## Parts

```text
StateView.tsx          the page: toolbar, breadcrumbs, the navigator, the inspector, the typed-text label
Toolbar/               navigator switch, filter box, type filter, sort
Breadcrumbs/           the path with sibling menus
Navigators/
  StateNav.tsx         shows the navigator that is chosen
  navigator-info.ts    what a navigator tells the rest (the path of the breadcrumbs, its types)
  MillerNav/ TreeNav/ TilesNav/
  Shared/              NavRow, virtual lists, type-ahead, the visible keys of a container
Inspector/
  PrimitiveEditor/     editors of a value, History and Info tabs, the chart
  ContainerEditor/     the grid, the bulk row, Add property, Edit as JSON
  ValueHeader/         name, path, pin, lock, delete
logic/  store-helpers/ sorting, filtering by type, the settings of the page
state-search.ts        the text of the filter and what matches
```

The lists (rows, columns, tiles, the grid) are **virtualized**: only what is in view is in the DOM
(`Navigators/Shared/create-virtual-list.ts`, over TanStack virtual). Each navigator only works with
the keys of a container as `getVisibleKeys` gives them (filtered by type, by the text of the
filter and by hidden filtered paths, sorted, pinned first).

## Where the data comes from, and how it flows

The panel polls the content script (`getUpdates`, every 200 ms by default) and gets a delta of
what changed in the game's state. `store/game-state.ts` applies each delta to the state, the frames
of the diff log and the history of every changed path. The navigators, the inspector and the
breadcrumbs read from there, and the selected path from `store/state-location.ts`. An edit goes the
other way, through `api.ts` to the content script, which changes the live game; the change comes
back with the next poll like any other.

- **The state** is one Solid store patched with the delta of each update, so only what changed
  notifies its readers. A value that the game removes while it is selected cuts the selected path.
- **History of values** comes from the diffs the diff log keeps (`PathRecord` in `game-state.ts`):
  the earlier values of a path, how often it changed, and when. Reloading the game starts it over.
  How many changes are kept is the setting "Changes kept".
- **Version signals**: `getStateVersion()` goes up on every change (the state search uses it),
  `getTypeVersion()` only when a value changes its type or an array item moves (what is computed
  from types alone, like the type filter, the sort by type and the toolbar's list of types, uses it,
  and does not run again when a number becomes another number).
- **An update that only changes hidden filtered paths** is applied to the state but gets no frame
  and no update id, so it does not push the other changes out of the diff log.
- **Writes** go through `api.ts`. Several values are written in one call (`setStateMulti`), which
  the content script applies between two polls, so the game sees one change; a failing write does
  not stop the others. Maps, Sets and Dates are sent in a marked form and restored in the content
  script (see [`../content-script.md`](../content-script.md)).
- **Locks** (`store/locks.ts`) are sent to the content script, which puts a locked value back (or
  into its range) on every poll and reports what it reverted.

## Settings that belong to the page

Settings > State page: split direction, tree layout, the recent change dot (how many updates),
pinning parent containers, the type-ahead pause. Settings > Diff log: text size, polling interval,
changes kept. Settings > Filtered paths and locks: where filtered paths are hidden, and the lists
of filtered paths and locked variables.
