# create-panel

- creates devtools panel

# devtools-panel

- The UI
- Communicates with service-worker via port?

# service-hub

- communications bridge
- injects content script
- communicates with devtools-panel via port (port.onMessage.addListener)
- communicates with content script via tabs.sendMessage / runtime.onMessage.addListener

# content-script

- does stuff
