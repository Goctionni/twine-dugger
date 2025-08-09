import { jsonReviver } from '@/shared/json-helper';
import { executeCode, injectContentScript } from './remote-execute';
import { getGameMetaFn } from './remote-functions/getMetaData';
import { Path } from '@/shared/shared-types';

export async function getGameMetaData() {
  return executeCode(getGameMetaFn);
}

export async function getState() {
  await injectContentScript();
  return executeCode(() => {
    if (!('TwineDugger' in window)) return null;
    return JSON.stringify(window.TwineDugger.getState(), window.TwineDugger.utils.jsonReplacer);
  }).then((jsonStr) => {
    if (typeof jsonStr !== 'string') return jsonStr;
    return JSON.parse(jsonStr, jsonReviver) as ReturnType<Window['TwineDugger']['getState']>;
  });
}

export async function getUpdates() {
  await injectContentScript();
  return executeCode(() => {
    if (!('TwineDugger' in window)) return null;
    return JSON.stringify(window.TwineDugger.getUpdates(), window.TwineDugger.utils.jsonReplacer);
  }).then((jsonStr) => {
    if (typeof jsonStr !== 'string') return jsonStr;
    return JSON.parse(jsonStr, jsonReviver) as ReturnType<Window['TwineDugger']['getUpdates']>;
  });
}

export async function setState(path: Array<string | number>, value: unknown) {
  await injectContentScript();
  return execDuggerFunction('setState', [path, value]);
}

export async function setStatePropertyLock(path: Path, lock: boolean) {
  await injectContentScript();
  return execDuggerFunction('setStatePropertyLock', [path, lock]);
}

export async function duplicateStateProperty(
  parentPath: Path,
  sourceKey: string | number,
  targetKey?: string,
) {
  await injectContentScript();
  return execDuggerFunction('duplicateStateProperty', [parentPath, sourceKey, targetKey ?? null]);
}

export async function deleteFromState(path: Array<string | number>) {
  await injectContentScript();
  return execDuggerFunction('deleteFromState', [path]);
}

type DuggerFunctionNames = Exclude<keyof Window['TwineDugger'], 'utils'>;
function execDuggerFunction<T extends DuggerFunctionNames>(
  fn: T,
  args: Parameters<Window['TwineDugger'][T]>,
): Promise<ReturnType<Window['TwineDugger'][T]>> {
  return executeCode(
    (functionName, ...rest) => {
      if (!('TwineDugger' in window)) return;
      const fn = window.TwineDugger[functionName as T] as Function;
      return fn(...rest);
    },
    {
      requires: ['content-script.js'],
      args: [fn, ...args],
    },
  );
}
