# Search: what happens when a letter is typed (level 4)

The goal is that the letter shows up at once, however slow the machine, and that the results follow as soon as possible. A search is therefore not run inside the key press.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Input as QueryBar input
  participant Idle as setQueryWhenIdle
  participant Browser
  participant Store as session state (store)
  participant Model as createSearch (memos)
  participant Lists as keyed projections
  participant Rows as ResultList rows

  User->>Input: types "t"
  Input->>Browser: the browser puts "t" in the input, runs oninput
  Input->>Idle: setQueryWhenIdle(read)
  Note over Idle: if a search is already waiting, nothing is added:<br/>it will read the input when it runs
  Idle->>Browser: requestIdleCallback(timeout: 50 ms)
  Browser-->>User: paints the frame with "t" (the input is not held back)
  User->>Input: types "h" (before the search ran)
  Input->>Idle: setQueryWhenIdle(read) (already waiting, ignored)

  Browser->>Idle: idle time (or 50 ms have passed)
  Idle->>Store: setQuery(read()) with "th"
  Store->>Model: query text changed
  Model->>Model: queryKey, compileQuery
  Model->>Model: passage stage: narrows from the hits of "t" if it can
  Model->>Model: state stage: walks the state
  Model->>Lists: filter + sort, reconcile by hit.key
  Lists->>Rows: hits that are still there keep their rows, and only changed fields and entering rows touch the DOM
  Browser-->>User: paints the new results
```

## Why it is built like this

- **Not in the key press.** A search costs 1–10 ms on a fast machine but 50–150 ms at 4–6× slower; inside the key press that time delays the letter itself. Measured at 6× slower: the letter took 153 ms (p50) to appear with the search in the key press, 37 ms with it in an idle callback.
- **Idle with a timeout.** An idle callback runs when the browser has nothing more urgent to do, which is just after the frame with the letter is painted. The 50 ms timeout is a limit: a page that stays busy (the game in the same page) cannot hold the search back for seconds. Without it, results were seen up to 3 seconds late in a test with a busy page.
- **Keys are not lost, and they are searched together.** The callback reads what is in the input when it runs, not what was typed when it was requested. If two letters arrive before it runs, one search handles both.
- **Not a debounce.** Nothing waits for a quiet moment. The delay is only as long as it takes the browser to get to it.
- **A running search is not interrupted.** If a search is longer than the time between two frames, the frame waits for it. That cannot be avoided without moving the search off the main thread.

Other ways of deferring the work (`scheduler.postTask` at several priorities, `scheduler.yield`, animation frame + message or timer, two animation frames) were measured; the ones that do not wait for the frame with the letter to be painted gave no improvement. The numbers are in `_local/perf-results.md`.

## What is not deferred

Toggling an option, a filter or the sort, clicking a result, clearing the query: these are clicks, and they update at once. Only typing is deferred.
