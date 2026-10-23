import type {
  FormatPassage,
  JSONSafeValue,
  Lock,
  Path,
  Write,
  WriteResult,
} from '@/shared/shared-types';

import { executeCode, injectContentScript } from './remote-execute';
import { getGameMetaFn } from './remote-functions/getMetaData';

export async function getGameMetaData() {
  return executeCode(getGameMetaFn);
}

export async function getUpdates(full = false) {
  await injectContentScript();
  return executeCode(
    (full) => {
      if (!('TwineDugger' in window)) return null;
      return window.TwineDugger.getUpdates(full);
    },
    { args: [full] },
  );
}

/**
 * Writes and deletes, in the order given, in one go between two updates of the game. A write that
 * fails does not stop the others. The results are logged here, nothing else is done with them yet.
 */
export async function setStateMulti(writes: Write[]): Promise<WriteResult[]> {
  const results =
    (await execDuggerFunction('setStateMulti', [writes])) ??
    writes.map((): WriteResult => ({ ok: false, error: 'The call to the page failed' }));

  results.forEach((result, index) => {
    if (!result.ok) console.error('[Twine Dugger]: A write failed', writes[index], result.error);
  });
  return results;
}

/** `deep`: Maps, Sets and Dates inside the value are restored too, not only the value itself */
export async function setState(
  path: Array<string | number>,
  value: JSONSafeValue,
  options: { deep?: boolean } = {},
) {
  const [result] = await setStateMulti([{ path: [...path], value, deep: options.deep }]);
  return result!;
}

export async function goToPassage(passageName: string) {
  await injectContentScript();
  return execDuggerFunction('goToPassage', [passageName]);
}

export async function setPassage(passage: FormatPassage) {
  await injectContentScript();
  return execDuggerFunction('setPassage', [passage]);
}

export async function setStatePropertyLocks(locks: Lock[]) {
  await injectContentScript();
  return execDuggerFunction('setStatePropertyLocks', [locks]);
}

export async function duplicateStateProperty(
  parentPath: Path,
  sourceKey: string | number,
  targetKey?: string,
) {
  await injectContentScript();
  return execDuggerFunction('duplicateStateProperty', [
    [...parentPath],
    sourceKey,
    targetKey ?? null,
  ]);
}

export async function deleteFromState(path: Array<string | number>) {
  const [result] = await setStateMulti([{ path: [...path], delete: true }]);
  return result!;
}

export async function getPassageData() {
  await injectContentScript();
  return execDuggerFunction('getPassageData', []);
}

type DuggerFunctionNames = Exclude<keyof Window['TwineDugger'], 'utils'>;
async function execDuggerFunction<T extends DuggerFunctionNames>(
  fn: T,
  args: Parameters<Window['TwineDugger'][T]>,
): Promise<ReturnType<Window['TwineDugger'][T]>> {
  await injectContentScript();
  return executeCode(
    (functionName, ...rest) => {
      if (!('TwineDugger' in window)) return;
      const fn = window.TwineDugger[functionName as T] as Function;
      return fn(...rest);
    },
    {
      args: [fn, ...args],
    },
  );
}

export async function gotoUrl(url: string) {
  return executeCode(
    (url) => {
      location.href = url;
    },
    { args: [url] },
  );
}
