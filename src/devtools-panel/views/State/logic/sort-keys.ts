import type { ValueType } from '@/shared/shared-types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const TYPE_ORDER: Partial<Record<ValueType, number>> = {
  object: 0,
  map: 1,
  array: 2,
  set: 3,
  boolean: 4,
  number: 5,
  string: 6,
};

/** Containers first, then the primitives, anything else last; by name within a type */
export function sortKeysByType<K extends string | number>(
  keys: readonly K[],
  getType: (key: K) => ValueType,
): K[] {
  const ranks = new Map(keys.map((key) => [key, TYPE_ORDER[getType(key)] ?? 7]));
  return keys.toSorted(
    (a, b) => ranks.get(a)! - ranks.get(b)! || collator.compare(String(a), String(b)),
  );
}
