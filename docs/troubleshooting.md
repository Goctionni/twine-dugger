# Troubleshooting

**Panel doesn't appear**

- Chrome: verify you loaded the **dist/** folder via **Load unpacked**.
- Firefox: verify you loaded `dist-ff/manifest.json` via **Load Temporary Add-on**. A temporary add-on does not survive a restart of Firefox, so check that it is still listed under `about:debugging` > **This Firefox**.
- Check the DevTools **Console** for extension logs.
- Ensure you're on a page running a Twine game.

**No state data / detection fails**

- Confirm the game's format. The content script works for storyformats SugarCube, Chapbook and Snowman, and Harlowe games using Chapel's custom macro framework.
- Reload the tab and DevTools, then try again.
