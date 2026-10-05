# Search: layout (level 4)

DevTools can be docked to the side, the bottom or undocked, so the page can be wide and short, narrow and tall, or anything between. The shape of the page follows from the **width of its own box**, measured with a `ResizeObserver` (`model/layout.ts`). Only the layout that is in use is mounted.

```mermaid
flowchart TD
  width["width of the page"] --> railq{"width >= 760 px?"}

  railq -->|yes| rail["Filters: RAIL (all four groups beside the results; the query bar is above the results only)"]
  railq -->|no| narrow{"setting search.narrowStyle"}
  narrow -->|strip| strip["Filters: STRIP (icons, each opens a flyout; the toggle is inside the strip)"]
  narrow -->|bar| bar["Filters: BAR (buttons under the query; the toggle is left of the query bar)"]

  rail --> d1{"width >= 1120 px?"}
  strip --> d2{"width >= 900 px?"}
  bar --> d2

  d1 -->|yes| column1["Detail: COLUMN beside the results"]
  d1 -->|no| sheet1["Detail: SHEET over the page (has a Close bar)"]
  d2 -->|yes| column2["Detail: COLUMN beside the results"]
  d2 -->|no| sheet2["Detail: SHEET over the page (has a Close bar)"]
```

## The pieces

```mermaid
flowchart LR
  subgraph rail["Wide: rail + results + detail column"]
    direction LR
    r1["Filter rail<br/>(full height)"]
    subgraph rmain["main"]
      direction TB
      rq["Query bar"] --> rc["Active chips"] --> rv["View switch"] --> rr["Results"]
    end
    r3["Detail column<br/>(click the selected result again to close)"]
    r1 --- rmain --- r3
  end

  subgraph narrow["Narrow: strip or bar, detail as a sheet"]
    direction TB
    n1["Query bar (with the strip/bar toggle in bar mode)"]
    n2["Strip (left) or filter bar (top)"]
    n3["Active chips, view switch, results"]
    n4["Detail sheet over everything while a result is selected"]
    n1 --> n2 --> n3 --> n4
  end
```

## Notes

- **Closing the detail.** In the column, clicking the selected result again deselects it (no title bar). In the sheet, which covers the results, there is a Close bar.
- **Same groups, three presentations.** `ScopeFilter`, `SortFilter`, `TypeFilter` and `TagFilter` know nothing about layout. `FilterRail` stacks them, `FilterStrip` and `FilterBar` each put one in a `Popover`.
- **Thresholds** are constants in `model/layout.ts` (`RAIL_MIN_WIDTH`, `DETAIL_MIN_WIDTH_WITH_RAIL`, `DETAIL_MIN_WIDTH`).
- **Row heights are fixed** per row type (state 30 px, passage 54 px), so the virtual list needs no measuring; long text is cut off with an ellipsis, and the detail has the whole text.
