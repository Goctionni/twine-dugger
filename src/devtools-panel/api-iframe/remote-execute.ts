// Same exports as ../api/remote-execute.ts, for the panel running in a normal tab with the game in an
// iframe (build/plugin-game-iframe.ts swaps this module in).

type GameWindow = Window & typeof globalThis;

interface ExecuteCodeOptions<TArgs extends unknown[]> {
  args?: TArgs;
  codeDescription?: string;
}

const getGameWindow = () =>
  (document.getElementById('game') as HTMLIFrameElement).contentWindow as GameWindow;

export async function executeCode<T, TArgs extends unknown[] = unknown[]>(
  callback: (...args: TArgs) => T,
  { args, codeDescription }: ExecuteCodeOptions<TArgs> = {},
) {
  const evalCode = `(${callback.toString()}).apply(null, ${JSON.stringify(args ?? [])})`;
  try {
    const result = getGameWindow().eval(evalCode) as T;
    // inspectedWindow.eval hands back a serialized copy
    return (result === undefined ? result : JSON.parse(JSON.stringify(result))) as T;
  } catch (ex) {
    console.error('[executeCode]: Error occured executing code', { ex, codeDescription, evalCode });
    return null;
  }
}

export async function injectContentScript() {
  const isInjected = () => 'TwineDugger' in getGameWindow();
  if (isInjected()) return;

  const script = getGameWindow().document.createElement('script');
  script.type = 'module';
  script.src = '/src/content-script/content-script.ts';
  getGameWindow().document.documentElement.appendChild(script);

  // The dev server transforms the script on its first request, which takes longer than the real extension
  for (const timeout = Date.now() + 10_000; Date.now() < timeout;) {
    if (isInjected()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  console.error('[injectContentScript]: Failed to verify loading of contentscript after 10s');
}
