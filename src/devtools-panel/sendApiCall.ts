import { isZodDef } from '../helper';
import { RpcRequest, RpcResponseDef } from '../rpc/rpc-schemas';

const tabId = chrome.devtools.inspectedWindow.tabId;
const portName = `devtools-panel-${tabId}`;

let __port: chrome.runtime.Port | null = null;

function getPort() {
  if (!__port) {
    __port = chrome.runtime.connect({ name: portName });
    __port.onDisconnect.addListener(() => {
      __port = null;
    });
  }
  return __port;
}

export function sendApiCall<T>(request: RpcRequest) {
  const port = getPort();

  return new Promise<T>((resolve, reject) => {
    let isFinished = false;

    const timeout = setTimeout(() => {
      console.log('Panel: Timeout');
      if (isFinished) return;
      isFinished = true;
      reject('timeout for response');
      cleanup();
    }, 10000);

    const disconnectListener = () => {
      console.log('Panel: Port Disconnected');
      if (isFinished) return;
      isFinished = true;
      reject('port disconnected');
      cleanup();
    };

    const messageListener = (message: unknown) => {
      console.log('Panel: Received message', message);
      if (isFinished) return;
      if (!isZodDef(message, RpcResponseDef)) return;
      if (message.id !== request.id) return;

      if (message.isError) reject(message.value);
      else resolve(message.value);
      cleanup();
    };

    port.onDisconnect.addListener(disconnectListener);
    port.onMessage.addListener(messageListener);

    port.postMessage({ ...request, tabId });

    function cleanup() {
      console.log('Clean up called');
      clearTimeout(timeout);
      port.onDisconnect.removeListener(disconnectListener);
      port.onMessage.removeListener(messageListener);
    }
  });
}
