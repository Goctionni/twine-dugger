import { jsonReviver } from '@/shared/json-helper';
import { executeCode, injectContentScript } from './remote-execute';
import { getGameMetaFn } from './remote-functions/getMetaData';

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

export async function getDiffs() {
  await injectContentScript();
  return executeCode(() => {
    if (!('TwineDugger' in window)) return null;
    return JSON.stringify(window.TwineDugger.getDiffs(), window.TwineDugger.utils.jsonReplacer);
  }).then((jsonStr) => {
    if (typeof jsonStr !== 'string') return jsonStr;
    return JSON.parse(jsonStr, jsonReviver) as ReturnType<Window['TwineDugger']['getDiffs']>;
  });
}

export async function setState(path: Array<string | number>, value: unknown) {
  await injectContentScript();
  return executeCode(
    (path, value) => {
      if (!('TwineDugger' in window)) return;
      return window.TwineDugger.setState(path as Array<string | number>, value);
    },
    {
      requires: ['content-script.js'],
      args: [path, value],
    },
  );
}
