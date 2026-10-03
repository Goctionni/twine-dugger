import type { JSONSafeArray, JSONSafeObject, JSONSafeValue, ValueType } from './shared-types';

/** Marks objects that stand in for a non-JSON value (Map, function, Date) */
export const TYPE_KEY = '__twinedugger-type' as const;
/** First element of an array that stands in for a Set */
export const SET_MARKER = `${TYPE_KEY}: Set` as const;

export type ContainerType = 'object' | 'array' | 'map' | 'set';

export function getJsonType(value: unknown): ValueType {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'undefined') {
    return t as ValueType;
  }
  if (Array.isArray(value)) return value[0] === SET_MARKER ? 'set' : 'array';
  if (t === 'object') {
    switch ((value as Record<string, unknown>)[TYPE_KEY]) {
      case 'Map':
      case 'NumberMap':
        return 'map';
      case 'function':
        return 'function';
      case 'Date':
        return 'date';
      default:
        return 'object';
    }
  }
  return 'other';
}

export function isNumberLike(key: string) {
  const number = Number(key);
  return Number.isFinite(number) && String(number) === key;
}

export function isNumberMapValue(value: JSONSafeValue) {
  return getJsonType(value) === 'map' && (value as JSONSafeObject)[TYPE_KEY] === 'NumberMap';
}

export function isContainerType(type: ValueType): type is ContainerType {
  return type === 'object' || type === 'array' || type === 'map' || type === 'set';
}

export function getContainerKeys(value: unknown, type: ContainerType): Array<string | number> {
  const arr = value as JSONSafeArray;
  if (type === 'array') return Array.from({ length: arr.length }, (_, i) => i);
  if (type === 'set') return Array.from({ length: Math.max(0, arr.length - 1) }, (_, i) => i + 1);
  const keys = Object.keys(value as object);
  return type === 'map' ? keys.filter((key) => key !== TYPE_KEY) : keys;
}

export function getPathValue(
  root: JSONSafeValue,
  path: ReadonlyArray<string | number>,
): JSONSafeValue {
  let value = root;
  for (const key of path) {
    if (value === null || typeof value !== 'object') return undefined;
    value = (value as Record<string | number, JSONSafeValue>)[key];
  }
  return value;
}

export function jsonEqual(a: JSONSafeValue, b: JSONSafeValue): boolean {
  if (a === b || Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.hasOwn(b, key) && jsonEqual(a[key as never], b[key as never]));
}

export function containsFunction(value: JSONSafeValue): boolean {
  if (getJsonType(value) === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some(containsFunction);
}

export function getKeyLabel(type: ContainerType, key: string | number) {
  return type === 'set' && typeof key === 'number' ? key - 1 : key;
}
