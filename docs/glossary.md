# Glossary

- **Twine**: Open-source tool for interactive fiction; popular formats include **SugarCube**, **Harlowe**.
- **Passage**: A node/screen in a Twine story; often referenced by name.
- **DevTools Panel**: Custom panel embedded in Chrome's Developer Tools for the inspected page.
- **Content Script**: Script that runs in the page context and exposes `window.TwineDugger`.
- **Diff Frame**: A batch of changes between two consecutive state snapshots.
- **Path**: Array of keys/indices locating a nested value within the Twine state.
- **View / Page**: A _view_ (`src/devtools-panel/views/<Feature>/`) is the feature's code; a _page_ (`src/devtools-panel/pages/`) only places views on a route.
- **Query matcher**, **hit**, **scope**, **narrowing**: terms of the search, see [`search/README.md`](./search/README.md#words-used-here).
