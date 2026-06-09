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
  if (!('chrome' in globalThis) || !('debugger' in globalThis.chrome)) {
    const isDebug = await executeCode(() => 'REPL' in window);
    if (isDebug) await executeCode(exposeUsingDebugREPL);
    return;
  }

  return exposeUsingChromeDevToolsProtocol();
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

function exposeUsingDebugREPL() {
  if ('REPL' in window && typeof window.REPL !== 'function') return false;

  let originalEvalWrapper: (code: string) => void;

  Object.defineProperty(Object.prototype, 'eval', {
    get() {
      return (code: string) => {
        try {
          originalEvalWrapper(`
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
          `);
        } catch (e) {
          console.error('Harlowe prototype injection failed:', e);
        } finally {
          delete (Object.prototype as Record<string, unknown>).eval;
        }

        return originalEvalWrapper(code);
      };
    },
    set(val) {
      originalEvalWrapper = val;
    },
    configurable: true,
  });

  REPL('1');

  return '__HarloweInternals' in window;
}
