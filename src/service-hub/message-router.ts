import { createRpcRouter } from '../rpc/rpc-router'; // Assuming you have this
import type { RpcBaseMessage } from '../rpc/rpc-schemas';
import { injectContentScript } from './inject-content-script';

console.log('Twine Dugger SW: Service Worker starting...');

const devtoolsConnections: { [tabId: number]: chrome.runtime.Port } = {};

// --- RPC Routing Setup ---
createRpcRouter([
  {
    name: 'content-script',
    sendFunction: (message) => {
      if (typeof message.tabId === 'number') {
        injectContentScript(message.tabId).then(() => {
          console.log(`SW: Routing message to content-script in tab ${message.tabId}:`, message);
          chrome.tabs.sendMessage(message.tabId!, message);
        });
      } else {
        console.error('SW: Cannot route to content-script, missing target tabId:', message);
      }
    },
    initListener: (handler) => {
      // Listen for messages FROM content scripts (and other runtime messages)
      chrome.runtime.onMessage.addListener((message, sender) => {
        console.log('SW: Received runtime message:', message, 'from:', sender);
        handler(message);
        return false;
      });
    },
  },
  {
    name: 'devtools-panel',
    sendFunction: (message: RpcBaseMessage) => {
      if (message.tabId) {
        console.log(`SW: Routing message to devtools-panel for tab ${message.tabId}:`, message);
        devtoolsConnections[message.tabId].postMessage(message);
      } else {
        console.warn(
          `SW: No DevTools connection for tab ${message.tabId} to send message:`,
          message,
        );
      }
    },
    initListener: (handler) => {
      // Listen for connections FROM DevTools panels
      chrome.runtime.onConnect.addListener((port) => {
        const prefix = 'devtools-panel-';
        if (port.name.startsWith(prefix)) {
          const tabId = parseInt(port.name.substring(prefix.length), 10);
          devtoolsConnections[tabId] = port;
          console.log(`SW: DevTools panel connected for tab ${tabId}`);

          port.onMessage.addListener((message) => {
            console.log(`SW: Message from DevTools port (tab ${tabId}):`, message);
            if (message.action === 'rpcRequestToContentScript' && message.payload) {
              // Add tabId to the payload so the content-script route knows where to send it
              handler({
                ...message.payload,
                tabId: tabId,
                to: 'content-script',
              });
            } else if (message.type === 'rpc') {
              handler(message);
            }
          });
          port.onDisconnect.addListener(() => {
            delete devtoolsConnections[tabId];
            console.log(`SW: DevTools panel disconnected for tab ${tabId}`);
          });
        }
      });
    },
  },
]);

console.log('Twine Dugger SW: RPC Router created.');
