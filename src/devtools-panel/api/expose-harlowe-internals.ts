import {
  debuggerAttach,
  debuggerDetach,
  getFunctionId,
  getFunctionScopeId,
  getObjectIdFor,
  getScopeElements,
  runtimeCallFunctionOn,
  runtimeEnable,
} from './cdp/cdp';
import { executeCode } from './remote-execute';

export async function exposeHarloweInternals(): Promise<void> {
  // First attempt to expose internals by intercepting eval
  if (await executeCode(exposeViaEvalIntercept)) return;

  if ('chrome' in globalThis && 'debugger' in globalThis.chrome) {
    // Failing that, try expose via CDP.
    return exposeUsingChromeDevToolsProtocol();
  }
}

async function exposeUsingChromeDevToolsProtocol() {
  const tabId = chrome.devtools.inspectedWindow.tabId;

  try {
    await debuggerAttach(tabId);
    console.log('Debugger attached successfully.');

    await runtimeEnable(tabId);

    // Evaluate window.onerror to get its RemoteObject ID
    const functionId = await getFunctionId(tabId, 'window.onerror');
    const scopeId = await getFunctionScopeId(tabId, functionId);
    const scopeElements = await getScopeElements(tabId, scopeId);
    const requireObjectId = await getObjectIdFor(tabId, scopeElements, 'require');

    await runtimeCallFunctionOn(
      tabId,
      requireObjectId,
      `function() {
        const require = this;
        window.__HarloweInternals = {
          require,
          engine: require('engine'),
          state: require('state'),
          passages: require('passages'),
          macros: require('macros'),
          renderer: require('renderer'),
          section: require('section'),
          utils: require('utils'),
        };
      }`,
    );

    console.log('Successfully setup window.__HarloweInternals.');
  } catch (error) {
    console.error('Setup for window.__HarloweInternals failed:', error);
  } finally {
    await debuggerDetach(tabId);
    console.log('Debugger detached safely.');
  }
}

declare const REPL: (arg: unknown) => void;
declare const Harlowe: any;

function exposeViaEvalIntercept() {
  const exposeCode = `
    window.__HarloweInternals = {
      require,
      engine: require('engine'),
      state: require('state'),
      passages: require('passages'),
      macros: require('macros'),
      renderer: require('renderer'),
      section: require('section'),
      utils: require('utils'),
    };
  `.replaceAll(/[\r\n\s]/g, '');

  if (typeof Harlowe === 'object' && Harlowe && 'API_ACCESS' in Harlowe) {
    Harlowe.API_ACCESS.SECTION.create().eval({ type: 'string', text: exposeCode });
  }

  if ('__HarloweInternals' in window) return true;

  /*
    Harlowe's section class is assigned an eval property which is basically a thin wrapper for eval,
    However due to that wrapper code is evaluated inside the [[Scope]] of the Section.
    This scope gives access to Harlowe's internal require.

    Harlowe's REPL (debug method) creates a new section and calls eval on it; however...
    REPL wraps the code `Macros.run("print", [sectoin,OURCODE])`, which breaks our code.

    By setting a getter and setter for Object.prototype.eval, we can avoid our code being wrapped,
    while still allowing us to execute in the desired [[Scope]].
  */
  if ('REPL' in window && typeof window.REPL !== 'function') return false;

  const mockCode = 'DUGGERMOCKCODE';
  let baseEval: undefined | typeof eval = undefined;
  Object.defineProperty(Object.prototype, 'eval', {
    configurable: true,
    set(harloweEval) {
      baseEval = harloweEval;
    },
    get() {
      const capturedEval = baseEval;
      if (!capturedEval) return;

      return (code: string) => {
        // If This is not out custom trigger, perform eval assigned to the object
        if (!code.includes(mockCode)) return capturedEval(code);
        // Else, delete our override and execute out expose-code
        delete (Object.prototype as Record<string, unknown>).eval;
        return capturedEval(exposeCode);
      };
    },
  });

  REPL(mockCode);
  return '__HarloweInternals' in window;
}
