# Troubleshooting

**Panel doesn't appear**

- Verify you loaded the **dist/** folder via **Load unpacked**.
- Check the DevTools **Console** for extension logs.
- Ensure you're on a page running a Twine game.

**No state data / detection fails**

- Confirm the game's format. The content script works for storyformats SugarCube, Chapbook and Snowman, and Harlowe games using Chapel's custom macro framework.
- Reload the tab and DevTools, then try again.
