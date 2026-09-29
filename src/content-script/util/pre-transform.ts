import type { IdentityCache, IdentityLookup } from '@/shared/id-helper';
import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type {
  ArrayValue,
  ContainerValue,
  JSONSafeArray,
  JSONSafeObject,
  JSONSafeValue,
  MapValue,
  ObjectValue,
  Primitive,
  SetValue,
  Value,
} from '@/shared/shared-types';

// Harlowe keeps its own bookkeeping in properties prefixed with "TwineScript_", on the state itself
// and on the objects it stores in it. Those are not part of the game's state, so they are left out
// (for every format: a property with that name in another format is collateral).
const INTERNAL_PREFIX = 'TwineScript_';

function isInternal(key: string, value: Value) {
  if (key.startsWith(INTERNAL_PREFIX)) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  for (const valueKey in value) {
    if (valueKey.startsWith(INTERNAL_PREFIX)) return true;
  }
  return false;
}

export function pretransformState(
  state: ObjectValue,
): [JSONSafeObject, IdentityCache, IdentityLookup] {
  const identityCache: IdentityCache = new Map();
  const identityLookup: IdentityLookup = new Map();
  return [pretransformObject(state, identityCache, identityLookup), identityCache, identityLookup];
}

export function pretransformValue(
  value: Value,
  identityCache: IdentityCache,
  identityLookup: IdentityLookup,
): JSONSafeValue {
  if (!value) return value;
  const t = typeof value as 'string' | 'number' | 'boolean' | 'object' | 'function';
  if (t === 'string' || t === 'number' || t === 'boolean') return value as Primitive;

  const cached = identityCache.get(value as object);
  if (cached !== undefined) return cached;

  const result = pretransformOther(value as ContainerValue, identityCache, identityLookup);
  identityCache.set(value as object, result);
  identityLookup.set(result, value as object);
  return result;
}

function pretransformOther(
  value: ContainerValue | SetValue | Function | Date,
  identityCache: IdentityCache,
  identityRegistry: IdentityLookup,
): JSONSafeArray | JSONSafeObject {
  if (typeof value === 'function') return pretransformFunction(value);

  const constructor = value.constructor;
  if (constructor === Object || !constructor)
    return pretransformObject(value as ObjectValue, identityCache, identityRegistry);
  if (constructor === Array || Array.isArray(value))
    return pretransformArray(value as ArrayValue, identityCache, identityRegistry);
  if (constructor === Date || value instanceof Date) return pretransformDate(value as Date);
  if (constructor === Map || value instanceof Map)
    return pretransformMap(value as MapValue, identityCache, identityRegistry);
  if (constructor === Set || value instanceof Set)
    return pretransformSet(value as SetValue, identityCache, identityRegistry);
  return pretransformObject(value, identityCache, identityRegistry);
}

function pretransformFunction(fn: Function): JSONSafeObject {
  return { [TYPE_KEY]: 'function', str: Function.prototype.toString.call(fn) };
}

function pretransformDate(date: Date): JSONSafeObject {
  return {
    [TYPE_KEY]: 'Date',
    Y: date.getFullYear(),
    M: date.getMonth() + 1,
    D: date.getDate(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds(),
  };
}

function pretransformArray(
  array: ArrayValue,
  identityCache: IdentityCache,
  identityRegistry: IdentityLookup,
): JSONSafeArray {
  const len = array.length;
  const out = new Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = pretransformValue(array[i], identityCache, identityRegistry);
  }
  return out;
}

function pretransformMap(
  map: MapValue,
  identityCache: IdentityCache,
  identityRegistry: IdentityLookup,
): JSONSafeObject {
  const copy: JSONSafeObject = { [TYPE_KEY]: 'Map' };
  for (const [k, v] of map) {
    if (isInternal(String(k), v)) continue;
    copy[String(k)] = pretransformValue(v, identityCache, identityRegistry);
  }
  return copy;
}

function pretransformSet(
  set: SetValue,
  identityCache: IdentityCache,
  identityRegistry: IdentityLookup,
): JSONSafeArray {
  const copy: JSONSafeArray = new Array(set.size + 1);
  copy[0] = SET_MARKER;
  let i = 1;
  for (const value of set) {
    copy[i++] = pretransformValue(value, identityCache, identityRegistry);
  }
  return copy;
}

function pretransformObject(
  object: ObjectValue,
  identityCache: IdentityCache,
  identityRegistry: IdentityLookup,
): JSONSafeObject {
  const copy: JSONSafeObject = {};
  const keys = Object.keys(object);
  const len = keys.length;
  for (let i = 0; i < len; i++) {
    const key = keys[i]!;
    if (isInternal(key, object[key])) continue;
    copy[key] = pretransformValue(object[key], identityCache, identityRegistry);
  }
  return copy;
}
