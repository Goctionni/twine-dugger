---
name: browser-extension
description: How the panel talks to the game page, and Chrome versus Firefox differences. Use when changing the manifests, permissions, `remote-execute.ts`, how `content-script.js` is injected, or anything that may behave differently in Firefox. Also for running the panel without the extension.
---

# Browser extension parts

## Communication

- The panel (`src/devtools-panel/`) reaches the game page only through `devtools.inspectedWindow.eval`, wrapped by `executeCode` in `api/remote-execute.ts`. A function is serialized to a string and evaluated in the page, so arguments and results must be JSON-safe and the function cannot use anything from its closure.
- `injectContentScript()` adds a `<script>` for `content-script.js` (a web accessible resource) when `window.TwineDugger` is missing. That script runs in the page's own world: no extension APIs, and the page's CSP applies. The panel polls `window.TwineDugger`.
- `debugger` (Chrome only) exists for CDP, used for Harlowe games without the framework (`api/cdp/`). The scripting and activeTab permissions were removed in 2.0.1: do not add them back for something `inspectedWindow.eval` can do.

## Chrome and Firefox

- Firefox has `browser` and a `chrome` alias for it; Chrome has `chrome`, and `browser` from Chrome 148 (152 for an extension with a `devtools_page`).
- `inspectedWindow.eval` returns a different shape in each (a value, or `[value, exceptionInfo]`). `remote-execute.ts` detects which and normalizes: do not call it anywhere else.
- Both type packages are installed. An API in one may be missing or different in the other, so check both, and say when something could only be checked in one browser (jsdom shows neither).
  - `node_modules/@types/chrome/index.d.ts`: `grep -n "namespace devtools.inspectedWindow" ...`; `@since` marks the Chrome version.
  - `node_modules/@types/firefox-webext-browser/index.d.ts`: `grep -n "namespace browser.devtools" ...`; `@deprecated Unsupported on Firefox` marks gaps.

## Running the panel without the extension

Against a fake api: `references/mock-api.md`. Against a real game: the `game-harness` skill.
