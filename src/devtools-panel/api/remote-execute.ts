const devtools: typeof chrome.devtools | typeof browser.devtools = globalThis.chrome
  ? globalThis.chrome.devtools
  : browser.devtools;

interface ExecuteCodeOptions<TArgs extends unknown[]> {
  args?: TArgs;
  codeDescription?: string;
}

type EvaluationExceptionInfo = Partial<chrome.devtools.inspectedWindow.EvaluationExceptionInfo>;
type EvalBehavior = 'immediate' | 'array';

let evalBehavior: EvalBehavior | undefined = undefined;
const getEvalBehavior = () =>
  devtools.inspectedWindow.eval('123').then((res) => (Array.isArray(res) ? 'array' : 'immediate'));

async function evalWrapper<T>(code: string): Promise<T> {
  evalBehavior ??= await getEvalBehavior();
  if (evalBehavior === 'immediate') return chrome.devtools.inspectedWindow.eval<T>(code);

  const [result, exceptionInfo] = (await browser.devtools.inspectedWindow.eval(code)) as
    | [T, undefined]
    | [undefined, EvaluationExceptionInfo];

  if (result) return result;
  throw exceptionInfo;
}

export async function executeCode<T, TArgs extends unknown[] = unknown[]>(
  callback: (...args: TArgs) => T,
  { args, codeDescription }: ExecuteCodeOptions<TArgs> = {},
) {
  const evalCode = `(${callback.toString()}).apply(null, ${JSON.stringify(args ?? [])})`;
  try {
    return evalWrapper<T>(evalCode);
  } catch (ex) {
    const exceptionInfo = ex as EvaluationExceptionInfo;
    const msg = `[executeCode]: ${exceptionInfo?.isError ? 'Error occured before code could execute' : 'Error occured executing code'}`;
    console.error(msg, { ...exceptionInfo, codeDescription });
    return null;
  }
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

  for (const timeout = Date.now() + injectTestTimeout; ;) {
    if (await isInjected()) return;
    if (Date.now() >= timeout) {
      return console.error(
        `[injectContentScript]: Failed to verify loading of contentscript after ${injectTestTimeout}ms`,
      );
    }
    await delay(injectTestInterval);
  }
}
