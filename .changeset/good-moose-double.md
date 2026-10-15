---
'twine-dugger': patch
---

Bugfix: The extension no longer reports an error when executing code in the game-window that returned false, 0, empty or null. Tracking now retries after a failed update, and only shows the error screen when errors keep happening within a minute.
