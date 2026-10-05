# Search: the parts in detail (level 4)

Step-by-step diagrams of the parts that are not obvious from the code layout.

## Searching the passages (`core/passage-search.ts`)

Two passes: the cheap one first (names and tags), the content (almost all of the cost) only for the rest. The order of the hits is the order of "best match": name or tag matches first.

```mermaid
flowchart TD
  start["searchPassages(passages, query, scope)"] --> loop1["for each passage"]
  loop1 --> pass1{"name or tag matches?<br/>(only if in scope)"}
  pass1 -->|yes| titleHit["title hit<br/>(also records the first match in the content)"]
  pass1 -->|no| rest["goes to the rest"]
  titleHit --> loop1
  rest --> loop1
  loop1 -->|"all done"| pass2{"content in scope?"}
  pass2 -->|no| done
  pass2 -->|yes| loop2["for each of the rest: first match in the content?"]
  loop2 -->|yes| contentHit["content hit"]
  loop2 -->|no| skip["no hit"]
  contentHit --> loop2
  skip --> loop2
  loop2 -->|"all done"| done["hits = title hits, then content hits<br/>passages = the matching passages, in the order they were given (to narrow from)<br/>tagCounts = how many hits have each tag"]
```

## Searching the state (`core/state-search.ts`)

An iterative walk (no recursion), in the order of the state. The path text is built while walking, so a hit has what the row shows.

```mermaid
flowchart TD
  start["stack = [root]"] --> pop{"stack empty?"}
  pop -->|yes| done["hits + typeCounts"]
  pop -->|no| take["take a container"]
  take --> isContainer{"object, array, map or set?<br/>(not a function or a date)"}
  isContainer -->|no| pop
  isContainer -->|yes| keys["for each key of the container (type marker skipped)"]
  keys --> path{"path in scope, and the container is an object or a map<br/>and the key matches?"}
  keys --> value{"value in scope, and the value is a string,<br/>number or boolean and its text matches?"}
  path --> hit
  value --> hit["a hit: key, path, path text, type, value, match ranges"]
  keys --> child{"the child is a container?"}
  child -->|yes| push["push it (reversed, so the first one is searched first)"]
  push --> pop
  hit --> pop
  child -->|no| pop
```

## From hits to rows (`ResultList`)

Only the rows in view exist. A row belongs to a **hit**, not to a position.

```mermaid
flowchart LR
  order["order: plain array<br/>(new on every change)"] --> virtualizer["createVirtualizer<br/>count = order.length<br/>getItemKey = order[i].key<br/>reconcileBy: 'key'"]
  virtualizer --> items["virtual items (a projection):<br/>an item that is still there is the same object"]
  list["list: keyed projection of hits"] --> row
  items --> row["row for a virtual item<br/>hit = list[item.index] (a memo)"]
  row --> content["StateRow / PassageRow<br/>Highlight, PrettyPath: marks the matches<br/>with the CSS Custom Highlight API"]
```

When the query changes, a hit that is still in the results keeps its row (nothing is written to the DOM if its matches did not change), an entering hit gets a new row, and a leaving hit loses its row. A test (`ResultList.test.tsx`) checks that a change that leaves the hits as they are produces no DOM mutations at all.

## Marking matches

```mermaid
flowchart LR
  ranges["match ranges (positions in a text)"] --> hl["highlightRanges(root, ranges)"]
  hl --> find["find the text nodes of root, in order"]
  find --> make["a DOM Range per match (binary search for the text node)"]
  make --> reg["add them to CSS.highlights['search-match']"]
  reg --> css["style.css: ::highlight(search-match)"]
  hl --> cleanup["the returned function removes the ranges again"]
```

The markup is never changed to show a match: the text is one text node (or the pieces `PrettyPath` makes), and the highlight is drawn over it. The editor uses the same function for the matches in a passage, and scrolls to the first one.

## Opening a result (`DetailPane`)

```mermaid
flowchart TD
  click["click on a row"] --> toggle{"already the selected result?"}
  toggle -->|yes| clear["selection = none"]
  toggle -->|no| select["selection = this result<br/>(two row flags change)"]
  select --> section{"section"}
  section -->|passage| pd["PassageDetail: name, tags, Go to passage, Open in Passages,<br/>the editor with the matches marked, saving through savePassage"]
  section -->|state| sd["StateDetail: type, PrettyPath, the live value in the<br/>same inputs as the State page, Show in State view"]
```
