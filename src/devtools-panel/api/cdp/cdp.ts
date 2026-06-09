import type {
  RuntimeEvaluateParams,
  RuntimeEvaluateResponse,
  RuntimeGetPropertiesParams,
  RuntimeGetPropertiesResponse,
  RuntimeCallFunctionOnParams,
  RuntimeCallFunctionOnResponse,
  ScopePropertyDescriptor,
} from './cdp-types';

const CDP_VERSION = '1.3';

export function debuggerAttach(tabId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chrome.debugger.attach({ tabId }, CDP_VERSION, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Attach failed: ${chrome.runtime.lastError.message}`));
      } else {
        resolve();
      }
    });
  });
}

export function debuggerDetach(tabId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chrome.debugger.detach({ tabId }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Detach failed: ${chrome.runtime.lastError.message}`));
      } else {
        resolve();
      }
    });
  });
}

export function runtimeEnable(tabId: number): Promise<void> {
  return sendCommand<{}, void>(tabId, 'Runtime.enable');
}

function runtimeEvaluate(tabId: number, expression: string): Promise<RuntimeEvaluateResponse> {
  return sendCommand<RuntimeEvaluateParams, RuntimeEvaluateResponse>(tabId, 'Runtime.evaluate', {
    expression,
  });
}

function runtimeGetProperties(
  tabId: number,
  objectId: string,
  ownProperties: boolean = true,
): Promise<RuntimeGetPropertiesResponse> {
  return sendCommand<RuntimeGetPropertiesParams, RuntimeGetPropertiesResponse>(
    tabId,
    'Runtime.getProperties',
    {
      objectId,
      ownProperties,
    },
  );
}

export function runtimeCallFunctionOn(
  tabId: number,
  objectId: string,
  functionDeclaration: string,
): Promise<RuntimeCallFunctionOnResponse> {
  return sendCommand<RuntimeCallFunctionOnParams, RuntimeCallFunctionOnResponse>(
    tabId,
    'Runtime.callFunctionOn',
    {
      objectId,
      functionDeclaration,
    },
  );
}

export async function getFunctionId(tabId: number, path: string) {
  const evalResult = await runtimeEvaluate(tabId, path);
  if (evalResult.exceptionDetails || !evalResult.result.objectId) {
    throw new Error(`Could not find ${path} or it is undefined.`);
  }

  return evalResult.result.objectId;
}

export async function getFunctionScopeId(tabId: number, functionId: string) {
  const propsResult = await runtimeGetProperties(tabId, functionId);
  const internalProps = propsResult.internalProperties ?? [];
  const scopesProp = internalProps.find((p) => p.name === '[[Scopes]]');

  if (!scopesProp?.value?.objectId) {
    throw new Error(
      `Could not find [[Scopes]] internal property on {functionId: "${functionId}"}.`,
    );
  }
  return scopesProp.value.objectId;
}

export async function getScopeElements(
  tabId: number,
  scopeId: string,
): Promise<ScopePropertyDescriptor[]> {
  const scopesResult = await runtimeGetProperties(tabId, scopeId);
  return scopesResult.result?.filter((p) => !isNaN(Number(p.name))) ?? [];
}

export async function getObjectIdFor(
  tabId: number,
  scopeElements: ScopePropertyDescriptor[],
  varName: string,
) {
  for (const scopeElement of scopeElements) {
    const scopeElementId = scopeElement.value?.objectId;
    if (!scopeElementId) continue;

    const varsResult = await runtimeGetProperties(tabId, scopeElementId);
    const vars = varsResult.result ?? [];
    const varProp = vars.find((v) => v.name === varName);

    if (varProp?.value?.objectId) return varProp.value.objectId;
  }
  throw new Error(
    `Harlowe closure scope containing '${varName}' was not found in the scope chain.`,
  );
}

function sendCommand<TParams, TResponse>(
  tabId: number,
  method: string,
  params?: TParams,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand(
      { tabId },
      method,
      params as { [key: string]: unknown },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`CDP ${method} failed: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(response as TResponse);
        }
      },
    );
  });
}
