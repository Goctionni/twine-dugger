# Search: why it is built this way

[`README.md`](./README.md) says what the parts are and how data flows. This document explains the
decisions that are not obvious from the code, most of which are there for speed. A game can have
thousands of passages with hundreds of kilobytes of text, and the state changes while the user types.
Measured on a real game (about 9,000 passages, 19 MB of text, 180 KB of state), a search itself takes
1 to 13 ms. What costs time is what comes after: rendering rows, layout and reactive updates. So
most of the design is about doing less of that, not about making matching faster.

Read this before changing how results are produced or shown.

## Two searches, not one

Passages and state are searched by two independent pipelines (`createPassageSearch`,
`createStateSearch`). Each has its own scope and its own source, so a change of the game state does
not search the passages and a change of the passages does not search the state. The state changes
all the time while the game runs, so this matters.

Filtering and sorting work on what was found and never search again. A tag filter is therefore a pass
over the hits, not over all passages.

## Filters come after the search

The filter groups show how many of what was _found_ has each tag or type. If filtering came first,
the counts of the tags you have not chosen would be gone, and every click on a tag would be a new
search over all passages. The counts are computed from the unfiltered result, and only while a filter
group that shows them is on the page.

## Narrowing

When the new search text is a longer version of the previous one (`a` then `ab`), anything it finds
the previous search found as well, so only the previous hits are searched. This is what
`QueryMatcher.canNarrowFrom` decides:

- not for regular expressions or whole word: `a+` matching does not tell anything about `a+b`;
- not when match case is switched off, because the new search then finds more;
- switching match case _on_ narrows (what matches with the case also matches without it);
- the same passages and the same scope are needed, or the previous result says nothing.

Passage search keeps the previous result in the memo itself (`previous` of `createMemo`), together
with what it looked at, so there is no bookkeeping outside of it. State is not narrowed: it is
searched in about 1 ms.

## Typing never waits for a search

The input only updates its own text on a key press. The search is started when the browser is idle,
with a timeout of 50 ms (`whenIdle`), and keys typed before it starts are one search. Without this,
every key press paid for a search and the rendering that follows, which made typing visibly lag on a
slow machine (about 4 times less time per key press once it was in place, at 6x CPU throttling).

The text and options live in module signals, not in the search bar component, so they survive visiting
another page.

## Rows keep their DOM

A search makes new hit objects. If the list were simply a `For` over them, every row would be thrown
away and built again on every key press. Instead `ResultList` puts the sorted hits through a
`createProjection` keyed by `hit.key`: a hit that is still there is the _same object_ as before, only
its fields (the positions of the matches) change, and only the fields that changed notify. The row of
that hit is left alone.

Some consequences:

- The list needs two things from the sorted hits: the stable objects for the rows to read, and the
  plain sorted array, which is new on every change and tells the virtualizer that the keys at its
  positions may have changed.
- The virtualizer and the projection do not update at the same moment, so a row can for a moment be
  past the end of the list. A row keeps the hit it had in that case (`?? previous` in `ResultList`),
  or rows that moved up would be thrown away and built again.
- Selecting a result is a plain signal that every visible row compares with its own hit. With about
  25 rows that is cheaper than keeping a flag per row in a store.

## Only what is in view exists

- Lists are virtualized with **fixed row heights** (state 30 px, passage 54 px), so no measuring is
  needed. A row must not contain anything that changes its height.
- Only the layout that is in use is mounted (full sidebar, icon bar or top bar; column or sheet).
- Rows have few reactive scopes and no inputs or editors: the editor only exists in the details pane.
- Match counts are not computed while searching. A passage hit only records the _first_ match in
  the content (where the snippet starts). The count shown on a row, and the count used by the
  "most matches" sort, are computed lazily: for the visible rows, and only while that sort is chosen.
- Names are ranked once for all passages (`rankNames`, one collator pass) and only when a name sort
  is used. Sorting hits is then a sort of numbers.

## Scope is a projection

The scope lives in the store as one object. Resetting the filters replaces it with a new object that
may have exactly the same flags, which would read as a change and search again. The searches read
their scope through a projection (`Object.assign(draft, getScope().passage)`), where a flag only
notifies when its value actually changes. The result of a passage search keeps a _copy_ of the scope
for the next narrowing check, because the projection is live and would always equal itself.

## Highlighting is an overlay

Matches are marked with the CSS Custom Highlight API (`ui/util/range-highlight.ts`,
`::highlight(search-match)` in `style.css`), not with `<mark>` elements. The markup of a row is just
its text, so marking does not change what is rendered, and the same function marks matches in rows,
in the path of a state result and in the editor.

The editor works through the whole text on every change, which is slow for large passages. The
setting `editor.disableHighlighting` says from which length a passage is first shown without syntax
highlighting; search marks are not affected.

## State paths are written twice

`logic/state-walk.ts` writes each path as text (`schedule.get("monday")`) so the query matcher can be
run over it, and `ui/display/PrettyPath.tsx` writes it again as coloured pieces. The positions of the
matches are offsets into the first text, so both must agree. `logic/state-walk.test.tsx` compares
them for a state with all kinds of keys: keep it passing when you touch either.

The walk is iterative, so a deep state cannot overflow the stack. Functions and dates are written as
objects in the state, but are not looked into.

## Known limits

- **A regular expression can freeze the panel.** Catastrophic backtracking (`(a+)+$`) runs in the
  panel's thread and there is no worker. A guard against nested quantifiers would be the first step if
  this becomes a problem.
- **The selected state result keeps the hit it was found with.** Its value is live in the detail
  (the inputs read the state), but its path and type are as they were when it was found. If a filter
  removes the hit from the list, the details stay open.
