import type { JSONSafeValue, ValueType } from './shared-types';

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

export function isContainerType(type: ValueType): type is ContainerType {
  return type === 'object' || type === 'array' || type === 'map' || type === 'set';
}

/** The keys under which a container's children live (the key of a Set item is its array index) */
export function getContainerKeys(value: unknown, type: ContainerType): Array<string | number> {
  const arr = value as JSONSafeValue[];
  if (type === 'array') return Array.from({ length: arr.length }, (_, i) => i);
  if (type === 'set') return Array.from({ length: Math.max(0, arr.length - 1) }, (_, i) => i + 1);
  const keys = Object.keys(value as object);
  return type === 'map' ? keys.filter((key) => key !== TYPE_KEY) : keys;
}

/** Like `getObjectPathValue`, but doesn't complain when the path no longer resolves */
export function getPathValue(root: unknown, path: ReadonlyArray<string | number>): unknown {
  let value = root;
  for (const key of path) {
    if (value === null || typeof value !== 'object') return undefined;
    value = (value as Record<string | number, unknown>)[key];
  }
  return value;
}
