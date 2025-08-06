interface ExecuteCodeOptions {
  requires?: string[];
  args?: unknown[];
}

function serializeArgs(args: unknown[]): unknown[] {
  return args.map(arg => {
    try {
      return JSON.parse(JSON.stringify(arg));
    } catch {
      return null;
    }
  });
}

export async function executeCode<T>(
  callback: (...args: unknown[]) => T,
  { args = [] }: ExecuteCodeOptions = {},
): Promise<T | null> {
  const safeArgs = serializeArgs(args);

  return chrome.scripting
    .executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      world: 'MAIN',
      func: callback,
      args: safeArgs,
    })
    .then((response) => response[0]?.result as T)
    .catch((err) => {
      console.error('executeCode error', err);
      return null;
    });
}

export async function injectContentScript() {
  const alreadyInjected = await chrome.scripting
    .executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      world: 'MAIN',
      func: () => 'TwineDugger' in window,
    })
    .then((response) => response[0]?.result);

  if (!alreadyInjected) {
    await chrome.scripting.executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      world: 'MAIN',
      files: ['content-script.js'],
    });
  }
}
