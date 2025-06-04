import { Value } from './shared-types';

export const isFunction = (value: unknown): value is Function => typeof value === 'function';
export const isArray = (value: unknown): value is Array<unknown> => Array.isArray(value);
export const isMap = (value: unknown): value is Map<string, unknown> => value instanceof Map;
export const isSet = (value: unknown): value is Set<unknown> => value instanceof Set;
export const isNull = (value: unknown): value is null => value === null;
export const isUndefined = (value: unknown): value is undefined => typeof value === 'undefined';
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object') return false;
  if (isNull(value)) return false;
  if (isArray(value)) return false;
  if (isMap(value)) return false;
  if (isSet(value)) return false;
  return true;
};

export function getSpecificType(value: Value) {
  if (isFunction(value)) return 'function';
  if (isArray(value)) return 'array';
  if (isSet(value)) return 'set';
  if (isMap(value)) return 'map';
  if (isString(value)) return 'string';
  if (isNumber(value)) return 'number';
  if (isNull(value)) return 'null';
  if (isBoolean(value)) return 'boolean';
  if (isUndefined(value)) return 'undefined';
  if (isObject(value)) return 'object';
  return 'other';
}

export function isNullish(value: unknown) {
  return value === null || typeof value === 'undefined';
}

export function isPrimitive(value: unknown) {
  const type = typeof value;
  if (type === 'object') return false;
  if (type === 'function') return false;
  return true;
}
