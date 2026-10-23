import type {
  JSONSafeArray,
  JSONSafeContainer,
  JSONSafeObject,
  JSONSafeValue,
  Path,
  ValueType,
} from './shared-types';

/** Marks objects that stand in for a non-JSON value (Map, function, Date) */
export const TYPE_KEY = '__twinedugger-type' as const;
/** First element of an array that stands in for a Set */
export const SET_MARKER = `${TYPE_KEY}: Set` as const;

/** Stand in for values that do not survive the trip to the panel, or the diff: NaN, the infinities, undefined */
export const NAN_MARKER = `${TYPE_KEY}: NaN` as const;
export const POSITIVE_INFINITY_MARKER = `${TYPE_KEY}: +Infinity` as const;
export const NEGATIVE_INFINITY_MARKER = `${TYPE_KEY}: -Infinity` as const;
export const UNDEFINED_MARKER = `${TYPE_KEY}: undefined` as const;

/** What a marker stands for, as text. Nothing for a value that is not one of the four markers */
export function getMarkedValueText(value: unknown): string | undefined {
  switch (value) {
    case NAN_MARKER:
      return 'NaN';
    case POSITIVE_INFINITY_MARKER:
      return 'Infinity';
    case NEGATIVE_INFINITY_MARKER:
      return '-Infinity';
    case UNDEFINED_MARKER:
      return 'undefined';
    default:
      return undefined;
  }
}

export const MARKED_VALUE_WRITE_ERROR = 'NaN, Infinity and undefined cannot be written from here';

/**
 * Whether `after` has a marker (see above) where `before` did not have the same one: a marker
 * that was there and stays is no new value. Containers are compared by key and index.
 */
export function hasNewMarkedValue(before: unknown, after: unknown): boolean {
  if (getMarkedValueText(after) !== undefined) return before !== after;
  if (after === null || typeof after !== 'object') return false;
  const previous = typeof before === 'object' && before !== null ? before : {};
  return Object.entries(after).some(([key, value]) =>
    hasNewMarkedValue((previous as Record<string, unknown>)[key], value),
  );
}

export type ContainerType = 'object' | 'array' | 'map' | 'set';

export function getJsonType(value: unknown): ValueType {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') {
    switch (value) {
      case NAN_MARKER:
        return 'NaN';
      case POSITIVE_INFINITY_MARKER:
      case NEGATIVE_INFINITY_MARKER:
        return 'infinity';
      case UNDEFINED_MARKER:
        return 'undefined';
      default:
        return 'string';
    }
  }
  if (t === 'number' || t === 'boolean' || t === 'undefined') return t as ValueType;
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

export function isContainer(value: JSONSafeValue): value is JSONSafeContainer {
  return isContainerType(getJsonType(value));
}

/** `getContainerKeys(value, type).length` without making the list: arrays can be large */
export function getContainerSize(value: JSONSafeContainer): number {
  if (Array.isArray(value)) return value[0] === SET_MARKER ? value.length - 1 : value.length;
  const size = Object.keys(value).length;
  return value[TYPE_KEY] === 'Map' || value[TYPE_KEY] === 'NumberMap' ? size - 1 : size;
}

export function getPathValue(
  root: JSONSafeContainer,
  path: ReadonlyArray<string | number>,
): JSONSafeValue {
  let value: JSONSafeValue = root;
  for (const key of path) {
    if (value === null || typeof value !== 'object') return undefined;
    value = (value as JSONSafeObject)[key];
  }
  return value;
}

/** The longest start of `path` that is still in `root` */
export function trimToExistingPath(root: JSONSafeContainer, path: Path): Path {
  let value: JSONSafeValue = root;
  for (let depth = 0; depth < path.length; depth++) {
    if (!isContainer(value) || !Object.hasOwn(value, path[depth]!)) return path.slice(0, depth);
    value = (value as JSONSafeObject)[path[depth]!];
  }
  return path;
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

export function getContainerKeyLabel(container: JSONSafeContainer, key: string | number) {
  if (typeof key === 'string') return key;
  const isSet = Array.isArray(container) && container[0] === SET_MARKER;
  return String(isSet ? key - 1 : key);
}
