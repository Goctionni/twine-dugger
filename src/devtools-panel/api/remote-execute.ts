interface ExecuteCodeOptions {
  requires?: string[];
  args?: unknown[];
}

export async function executeCode<T>(
  callback: (...args: unknown[]) => T,
  { args = [] }: ExecuteCodeOptions = {},
) {
  return chrome.scripting
    .executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      world: 'MAIN',
      func: callback,
      args,
    })
    .then((response) => response[0]?.result)
    .catch(() => null);
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
