import {
  MARKED_VALUE_WRITE_ERROR,
  SET_MARKER,
  TYPE_KEY,
  hasNewMarkedValue,
} from '@/shared/json-safe';
import type { JSONSafeValue, Path, ValueType } from '@/shared/shared-types';

export const NEW_TYPES = ['string', 'number', 'boolean', 'object', 'map', 'array', 'set'] as const;
export type NewType = (typeof NEW_TYPES)[number];

/** The containers that get a new value from the panel: the items of a set have no place to be named */
export type AddTarget = 'object' | 'map' | 'array';

export const isContainerType = (type: NewType) =>
  type === 'object' || type === 'map' || type === 'array' || type === 'set';

/** What a new value of a type is, before anything is typed. Containers are added empty */
export function getEmptyValue(type: NewType): JSONSafeValue {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'map':
      return { [TYPE_KEY]: 'Map' };
    case 'array':
      return [];
    case 'set':
      return [SET_MARKER];
  }
}

export const toJsonText = (value: JSONSafeValue) => JSON.stringify(value, null, 2);

export type Parsed = { value: JSONSafeValue } | { error: string };

const isPlainObject = (value: unknown): value is Record<string, JSONSafeValue> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The value in the text, when it is a value of the chosen type. A Map and a Set have their marker */
export function parseJsonValue(type: NewType, text: string): Parsed {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { error: 'This is not valid JSON' };
  }
  if (hasNewMarkedValue(undefined, value)) return { error: MARKED_VALUE_WRITE_ERROR };

  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
      return typeof value === type
        ? { value: value as JSONSafeValue }
        : { error: `Expected a ${type}` };
    case 'object':
      if (!isPlainObject(value)) return { error: 'Expected an object' };
      return TYPE_KEY in value
        ? { error: 'This is a marked value: choose the type Map' }
        : { value };
    case 'map':
      return isPlainObject(value) && (value[TYPE_KEY] === 'Map' || value[TYPE_KEY] === 'NumberMap')
        ? { value }
        : { error: `Expected an object with "${TYPE_KEY}": "Map"` };
    case 'array':
      if (!Array.isArray(value)) return { error: 'Expected an array' };
      return value[0] === SET_MARKER
        ? { error: 'This is marked as a Set: choose the type Set' }
        : { value };
    case 'set':
      return Array.isArray(value) && value[0] === SET_MARKER
        ? { value }
        : { error: `Expected an array that starts with "${SET_MARKER}"` };
  }
}

/** The type to start from: only when everything that is in the container is of one type */
export function getDefaultType(childTypes: readonly ValueType[]): NewType | undefined {
  const first = childTypes[0];
  if (first === undefined || childTypes.some((type) => type !== first)) return undefined;
  return NEW_TYPES.find((type) => type === first);
}

/** What is wrong with a name for the new property, if anything */
export function checkName(name: string, existingKeys: readonly (string | number)[]) {
  if (name.trim() === '') return 'A name is needed';
  if (name === TYPE_KEY) return 'That name is reserved';
  if (existingKeys.some((key) => String(key) === name)) return `${name} already exists`;
  return undefined;
}

export interface NewProperty {
  /** Not for an array: its new item goes at the end */
  name?: string;
  value: JSONSafeValue;
}

/** Where the new value goes, and what is written there */
export function getAddition(
  containerPath: Path,
  target: AddTarget,
  size: number,
  { name, value }: NewProperty,
) {
  const key = target === 'array' ? size : name!;
  return { path: [...containerPath, key], value };
}
