interface ExecuteCodeOptions {
  requires?: string[];
  args?: unknown[];
}

export async function executeCode<T>(
  callback: (...args: unknown[]) => T,
  { requires = [], args = [] }: ExecuteCodeOptions = {},
) {
  await Promise.all(requires.map((file) => injectFile(file)));

  return chrome.scripting
    .executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      world: 'MAIN',
      func: callback,
      args,
    })
    .then(([{ result }]) => result)
    .catch(() => null);
}

interface InjectFileOptions {
  injectOnce?: boolean;
}

const injectedFiles: Record<string, boolean> = {};
export async function injectFile(file: string, { injectOnce = false }: InjectFileOptions = {}) {
  if (injectOnce || injectedFiles[file]) return;

  injectedFiles[file] = true;
  await chrome.scripting.executeScript({
    target: { tabId: chrome.devtools.inspectedWindow.tabId },
    world: 'MAIN',
    files: [file],
  });
}
