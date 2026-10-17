import {
  getContainerKeys,
  getJsonType,
  isContainerType,
  isNumberMapValue,
} from '@/shared/json-safe';
import type { JSONSafeValue, ValueType } from '@/shared/shared-types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** The order of sorting by type, and of the type filter. Null, date and the like are 'other' */
export const TYPE_ORDER: ValueType[] = [
  'object',
  'map',
  'array',
  'set',
  'boolean',
  'number',
  'string',
  'other',
];

const getTypeRank = (type: ValueType) => {
  const rank = TYPE_ORDER.indexOf(type);
  return rank === -1 ? TYPE_ORDER.length - 1 : rank;
};

/** Containers first, then the primitives, anything else last; by name within a type */
export function sortKeysByType<K extends string | number>(
  keys: readonly K[],
  getType: (key: K) => ValueType,
): K[] {
  const ranks = new Map(keys.map((key) => [key, getTypeRank(getType(key))]));
  return keys.toSorted(
    (a, b) => ranks.get(a)! - ranks.get(b)! || collator.compare(String(a), String(b)),
  );
}

/**
 * The keys of a container by name, and by number when they are numbers. The items of an array and
 * of a set are in the order of their position.
 */
export function getKeysByName(container: JSONSafeValue): Array<string | number> {
  const type = getJsonType(container);
  if (!isContainerType(type)) return [];
  const keys = getContainerKeys(container, type);
  if (type === 'array' || type === 'set') return keys;
  if (isNumberMapValue(container)) return keys.toSorted((a, b) => Number(a) - Number(b));
  return keys.toSorted((a, b) => collator.compare(String(a), String(b)));
}
