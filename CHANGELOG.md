# twine-dugger

## 2.0.1

### Patch Changes

- d76f808: Remove scripting and activeTab from extension manifest

## 2.0.0

### Major Changes

- 0c2f572: Complete rewrite of the State view

  New features include:

  - 3 ways to navigate through state: Miller columns, a tree, and tiles
  - Breadcrumbs with menus to jump to siblings
  - Keyboard navigation, plus type-ahead to jump to a row by typing its name
  - Edit values in an inspector: booleans, numbers and text
  - Bulk editing values of the same type
  - Edit containers as JSON
  - View a variable's previous values and restore them, with a timeline chart for numbers
  - Lock number-values to within a given range
  - Pin important variables (they are listed first)
  - Recently changed indicators

### Minor Changes

- 0c2f572: Chrome 145 or later is now required.
- 0c2f572: Update: The diff log says "No changes yet" instead of showing an empty list.
- 0c2f572: New setting: choose where filtered paths are hidden: in the diff log, in the State page, or in both.
- 0c2f572: Update: The list of locked variables shows the value or range each variable is held at.
- 0c2f572: Update: Support for atypical numeric values (NaN, positive infinity, negative infinity).
- 0c2f572: Update: The Settings page has been recreated. Same settings with a better UI: descriptions, units, a "Restore default" button and short explanations.
- 0c2f572: Update: Support for undefined values.

### Patch Changes

- 0c2f572: Bugfix: A container with a locked value inside it can no longer be deleted (the game would put the locked part back).
- 0c2f572: Update: State updates with only ignored (filtered) properties no longer drain the diff log.
- 0c2f572: Bugfix: The State page copes when the game deletes the value you have selected.
- 0c2f572: Bugfix: The extension still works for SugarCube games where `Story.add` is missing (SugarCube 2.30).

## 1.9.1

### Patch Changes

- d60c09e: Bugfix: The extension no longer reports an error when executing code in the game-window that returned false, 0, empty or null. Tracking now retries after a failed update, and only shows the error screen when errors keep happening within a minute.

## 1.9.0

### Minor Changes

- 6805916: Rebuild search: More features and much better performance. You can now set 'match case', 'whole word' and 'regex' for the search string, choose where to search, what to include and how to order the results. The new layout is designed to work whether the extension is docked below, to the side or undocked on a second monitor. Settings were added allowing you to choose which search settings you want the extension to remember.
- a67e196: Breaking: The keyboard shortcut for global search is now `Ctrl`+`Shift`+`F`.
- a67e196: Update: Syntax highlighting is disabled for very large passages, with a button to turn it back on and settings to control when immediate highlighting is stopped

### Patch Changes

- a67e196: Bugfix: "Add property" now works with values of type Map and Set

## 1.8.0

### Minor Changes

- 89a01b4: Use jsondiffpatch for state diffing, rebuild the panel store on Solid 2, keep the diff log across game reloads, store locks per game, and speed up the diff log, object navigation and search

### Patch Changes

- 9a0c86a: Get rid of webextension polyfill
- 41314a1: Bugfix: Several fallbacks added when reading metadata from Harlowe/XLowe

## 1.7.1

### Patch Changes

- 87d4fb9: Fix chrome API change

## 1.7.0

### Minor Changes

- 572eb62: Added filters, sorting and search to object nav

## 1.6.0

### Minor Changes

- e6b7c92: Wider support for Harlowe

## 1.5.1

### Patch Changes

- ab4d210: Add reload passages button

## 1.5.0

### Minor Changes

- 5e07230: Added support for storyformats Chapbook and Snowman

### Patch Changes

- a0eafe2: Refactor to avoid global type declarations

## 1.4.1

### Patch Changes

- 636aa95: Add firefox compatibility

## 1.4.0

### Minor Changes

- cb630fb: Add navigation to and ability to add passages

## 1.3.0

### Minor Changes

- 27c8caf: Lots of QoL fixes for locked values and filtered paths, big thanks to czer323

## 1.2.0

### Minor Changes

- 9e8cb2d: Update & improve search UI

## 1.1.0

### Minor Changes

- 5152391: project refactor

## 1.0.2

### Patch Changes

- 2f98912: syntax highlighting passage view

## 1.0.1

### Patch Changes

- c3319da: Support file protocol

## 1.0.0

### Major Changes

- 4d51c48: Added Search, Added Passage List, Added Add property button

## 0.5.1

### Patch Changes

- 384995a: Refactor difflogg format
