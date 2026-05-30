import browser from 'webextension-polyfill';

interface ExecuteCodeOptions<TArgs extends unknown[]> {
  args?: TArgs;
  codeDescription?: string;
}

export async function executeCode<T, TArgs extends unknown[] = unknown[]>(
  callback: (...args: TArgs) => T,
  { args, codeDescription }: ExecuteCodeOptions<TArgs> = {},
) {
  const evalCode = `(${callback.toString()}).apply(null, ${JSON.stringify(args ?? [])})`;
  const [result, ex] = await browser.devtools.inspectedWindow.eval(evalCode);
  const { isError, code, description, isException, details, value } = ex || {};

  if (isError) {
    console.error('[executeCode]: Error occured before code could execute', {
      codeDescription,
      code,
      description,
    });
    return null;
  }
  if (isException) {
    console.error('[executeCode]: Error occured executing code', {
      codeDescription,
      details,
      value,
    });
    return null;
  }
  return result as T;
}

const injectTestInterval = 50; // 50ms
const injectTestTimeout = 1000; // 1s
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function injectContentScript() {
  const isInjected = () => executeCode(() => 'TwineDugger' in window);
  if (await isInjected()) return;

  const scriptUrl = browser.runtime.getURL('content-script.js');
  await executeCode(
    (url) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => script.remove();
      document.documentElement.appendChild(script);
    },
    { args: [scriptUrl], codeDescription: 'Inject content-script.js' },
  );

  for (const timeout = Date.now() + injectTestTimeout; ; ) {
    if (await isInjected()) return;
    if (Date.now() >= timeout) {
      return console.error(
        `[injectContentScript]: Failed to verify loading of contentscript after ${injectTestTimeout}ms`,
      );
    }
    await delay(injectTestInterval);
  }
}
