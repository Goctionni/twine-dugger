import { ArrayValue, MapValue, ObjectValue, Value } from '@/shared/shared-types';
import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';

function detect() {
  if (!('Harlowe' in window)) return false;
  if (!window.Harlowe) return false;
  if (typeof window.Harlowe !== 'object') return false;

  if (!('API_ACCESS' in window.Harlowe)) return false;
  if (!window.Harlowe.API_ACCESS) return false;
  if (typeof window.Harlowe.API_ACCESS !== 'object') return false;

  if (!('STATE' in window.Harlowe.API_ACCESS)) return false;
  if (!window.Harlowe.API_ACCESS.STATE) return false;
  if (typeof window.Harlowe.API_ACCESS.STATE !== 'object') return false;

  if (!('variables' in window.Harlowe.API_ACCESS.STATE)) return false;
  if (!window.Harlowe.API_ACCESS.STATE.variables) return false;
  if (typeof window.Harlowe.API_ACCESS.STATE.variables !== 'object') return false;

  return true;
}

function setState(path: Array<string | number>, value: unknown) {
  type StateObj = ObjectValue | MapValue | ArrayValue;
  let stateObj: StateObj = window.Harlowe.API_ACCESS.STATE.variables;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const isLast = i + 1 === path.length;
    if (Array.isArray(stateObj)) {
      // Array
      if (!isLast) {
        stateObj = stateObj[Number(key)] as StateObj;
      } else {
        stateObj[Number(key)] = value as Value;
      }
    } else if (stateObj instanceof Map) {
      // Map
      if (!isLast) {
        stateObj = stateObj.get(`${key}`) as StateObj;
      } else {
        stateObj.set(`${key}`, value as Value);
      }
    } else {
      // Object
      if (!isLast) {
        stateObj = stateObj[`${key}`] as StateObj;
      } else {
        stateObj[`${key}`] = value as Value;
      }
    }

    if (!stateObj || typeof stateObj !== 'object') {
      console.error(`[Twine Dugger]: Tried to set state, but could not resolve path`, {
        path,
        value,
      });
      return;
    }
  }
}

export default {
  detect,
  getState: () => sanitize(window.Harlowe.API_ACCESS.STATE.variables),
  getDiffer: () => getDifferBase(ignoreCheck),
  setState,
  getPassage: () => window.Harlowe.API_ACCESS.STATE.passage,
} satisfies FormatHelpers;

function sanitize(obj: ObjectValue) {
  const result: ObjectValue = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('TwineScript_')) continue;
    if (
      value &&
      typeof value === 'object' &&
      Object.keys(value).some((subkey) => subkey.startsWith('TwineScript_'))
    )
      continue;
    result[key] = value;
  }
  return result;
}

function ignoreCheck(key: unknown, value: Value) {
  if (typeof key === 'string' && key.startsWith('TwineScript_')) return true;
  if (
    value &&
    typeof value === 'object' &&
    Object.keys(value).some((key) => key.startsWith('TwineScript_'))
  ) {
    return true;
  }
  return false;
}
