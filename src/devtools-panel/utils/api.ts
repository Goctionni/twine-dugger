import { jsonReviver } from '@/shared/json-helper';
import { executeCode } from './remote-execute';
import { getGameMetaFn } from './remote-functions/getMetaData';

export async function getGameMetaData() {
  return executeCode(getGameMetaFn);
}

export async function getState() {
  return executeCode(
    () => {
      if (!('TwineDugger' in window)) return null;
      return JSON.stringify(window.TwineDugger.getState(), window.TwineDugger.utils.jsonReplacer);
    },
    {
      requires: ['content-script.js'],
    },
  ).then((jsonStr) => {
    if (jsonStr) return JSON.parse(jsonStr, jsonReviver);
    return jsonStr;
  });
}

export async function getDiffs() {
  return executeCode(
    () => {
      if (!('TwineDugger' in window)) return null;
      return JSON.stringify(window.TwineDugger.getDiffs(), window.TwineDugger.utils.jsonReplacer);
    },
    {
      requires: ['content-script.js'],
    },
  ).then((jsonStr) => {
    if (jsonStr) return JSON.parse(jsonStr, jsonReviver);
    return jsonStr;
  });
}

export async function setState(path: Array<string | number>, value: unknown) {
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
