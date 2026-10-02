# State Diffing Model

Changes to the game state are tracked as **deltas** in the format of
[`jsondiffpatch`](https://github.com/benjamine/jsondiffpatch).

The content script keeps the last seen state and, each time the panel polls, returns the delta between
that state and the live one. To make this possible the live state is first converted to JSON safe values
(Maps, Sets, functions and Dates are represented by marked values, see `src/shared/json-safe.ts`).
Array items are matched by identity where the game provides it, so reordering and insertion don't show
up as rewrites of the whole array.

The panel applies each delta to its own copy of the state and keeps the deltas as its history. Earlier
states are reconstructed by undoing deltas, and the diff log shows each delta as a list of changes.

See `src/shared/shared-types.ts` for the shared types.
