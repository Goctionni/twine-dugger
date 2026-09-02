const devtools: typeof chrome.devtools | typeof browser.devtools = globalThis.chrome
  ? globalThis.chrome.devtools
  : browser.devtools;

interface ExecuteCodeOptions<TArgs extends unknown[]> {
  args?: TArgs;
  codeDescription?: string;
}

type EvaluationExceptionInfo = Partial<chrome.devtools.inspectedWindow.EvaluationExceptionInfo>;
type EvalResult = { result: unknown; exceptionInfo?: EvaluationExceptionInfo };
type EvalBehavior = 'immediate' | 'array';

let _evalBehavior: EvalBehavior | undefined = undefined;

async function setEvalBehavior() {
  if (!_evalBehavior) {
    const result = await devtools.inspectedWindow.eval('123');
    _evalBehavior = Array.isArray(result) ? 'array' : 'immediate';
  }
  return _evalBehavior;
}

async function evalWrapper(code: string): Promise<EvalResult> {
  const evalBehavior = await setEvalBehavior();
  if (evalBehavior === 'immediate') {
    try {
      const result = await chrome.devtools.inspectedWindow.eval(code);
      return { result };
    } catch (ex) {
      return { result: undefined, exceptionInfo: ex as EvaluationExceptionInfo };
    }
  }

  const [result, exceptionInfo] = (await browser.devtools.inspectedWindow.eval(code)) as [
    unknown,
    EvaluationExceptionInfo | undefined,
  ];
  return { result, exceptionInfo };
}

export async function executeCode<T, TArgs extends unknown[] = unknown[]>(
  callback: (...args: TArgs) => T,
  { args, codeDescription }: ExecuteCodeOptions<TArgs> = {},
) {
  const evalCode = `(${callback.toString()}).apply(null, ${JSON.stringify(args ?? [])})`;
  const { result, exceptionInfo } = await evalWrapper(evalCode);

  if (exceptionInfo?.isError) {
    console.error('[executeCode]: Error occured before code could execute', {
      ...exceptionInfo,
      codeDescription,
    });
    return null;
  }
  if (exceptionInfo?.isException) {
    console.error('[executeCode]: Error occured executing code', {
      ...exceptionInfo,
      codeDescription,
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
