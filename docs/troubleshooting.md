# Troubleshooting

**Panel doesn't appear**

- Verify you loaded the **dist/** folder via **Load unpacked**.
- Check the DevTools **Console** for extension logs.
- Ensure you're on a page running a Twine game.

**No state data / detection fails**

- The content script only works on **SugarCube** or **Harlowe**. Confirm the game's format.
- Reload the tab and DevTools, then try again.

**Edits not applying**

- Ensure you are editing a primitive type when using inline editors.
- For object/array edits, confirm the path and keys exist.

**Diffs never update**

- Interact with the game so its variables change.
- The diff engine compares the current snapshot to the last snapshot held in memory.
