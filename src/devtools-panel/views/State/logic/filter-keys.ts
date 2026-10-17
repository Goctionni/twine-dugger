import { getContainerKeys, getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import { toFilterType } from './sort-keys';

/** Without the keys of the hidden types. The key that is selected stays: the path shows it anyway */
export function filterKeysByType<K extends string | number>(
  keys: K[],
  getType: (key: K) => ValueType,
  hiddenTypes: readonly ValueType[],
  selectedKey?: K,
): K[] {
  if (!hiddenTypes.length) return keys;
  return keys.filter(
    (key) => key === selectedKey || !hiddenTypes.includes(toFilterType(getType(key))),
  );
}

/** How many of the values in a container the filter hides: 0 for what is not a container */
export function countHiddenKeys(
  container: JSONSafeValue,
  hiddenTypes: readonly ValueType[],
  selectedKey?: string | number,
): number {
  const type = getJsonType(container);
  if (!hiddenTypes.length || !isContainerType(type)) return 0;
  const keys = getContainerKeys(container, type);
  const getType = (key: string | number) => getJsonType((container as JSONSafeObject)[key]);
  return keys.length - filterKeysByType(keys, getType, hiddenTypes, selectedKey).length;
}
