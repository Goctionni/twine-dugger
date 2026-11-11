# Running the panel against a mocked api

`vp dev`, then open the URL it prints in a normal browser tab. No extension or game is needed.

The dev server plugin (`build/plugin-mock-api.ts`, serve only) replaces every module in `src/devtools-panel/api/` with the same-named file in `src/devtools-panel/api-mock/` when one exists. Today that is only `api.ts`, a small hand-written fake. It steps aside when another plugin provides the transport (`api/remote-execute`), as the game harness does. A production build ignores the mocks.

To fake more, add a file with the same name and exports. To test against a real game instead, see the `game-harness` skill.
