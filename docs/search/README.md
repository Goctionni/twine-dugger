# Search

The Search page finds text in the **state** of the game (keys and primitive values) and in its **passages** (name, tags, content), with match case, whole word and regex, filters, sorting and highlighted matches. These documents describe how it is built.

The documents go from the rough picture to the details. Read down as far as you need.

| Level | Document                                           | What it shows                                                                             |
| ----- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1     | [`overview.md`](./overview.md)                     | What search does, in one diagram                                                          |
| 2     | [`architecture.md`](./architecture.md)             | The layers (`core`, `model`, `ui`) and which module depends on which                      |
| 3     | [`data-flow.md`](./data-flow.md)                   | How a query becomes a list of rows, and what re-runs when something changes               |
| 4     | [`keystroke.md`](./keystroke.md)                   | What happens, in order, when a letter is typed                                            |
| 4     | [`layout.md`](./layout.md)                         | How the shape of the page follows from its width (DevTools can be docked anywhere)        |
| 4     | [`state-and-settings.md`](./state-and-settings.md) | What the page remembers while it is open, and what survives a restart                     |
| 4     | [`details.md`](./details.md)                       | The passage search, the state walk, rows, match marking and the detail view, step by step |

The code is in `src/devtools-panel/search/`; the page itself is `src/devtools-panel/pages/SearchPage.tsx`.

## Ideas that explain most of the design

- **A search is a plain function.** `(data, query) → hits`. It runs synchronously: measured at 1–2 ms for the state and 1–10 ms for 9,000 passages, so no worker, generators or chunking are used. The Solid-free `core/` can be tested in node and moved to a worker later if it is ever needed.
- **The steps depend on different things.** Passages are only searched again when the query, the passage part of the scope or the passages change. The state is only searched again when the query, the state part of the scope or the state change. Filtering and sorting work on what was found and never search again.
- **Identity over everything.** Hits live in a keyed projection (`createProjection`, keyed by `hit.key`). A hit that is still there after a query change is the same object, so its row is not rebuilt, and nothing is written to the DOM for it.
- **Rows are cheap.** Only the rows in view exist (virtualized, fixed heights), each with a few reactive scopes. Anything heavy (the editor, inputs) only exists for the selected result.
- **Typing is never blocked by a search.** The query is committed when the browser is idle (at the latest 50 ms later), not inside the key press. See [`keystroke.md`](./keystroke.md).
- **Only the layout that is shown is mounted.** Rail, strip or bar; column or sheet.

Measurements are in `_local/perf-results.md` (not in the repository).
