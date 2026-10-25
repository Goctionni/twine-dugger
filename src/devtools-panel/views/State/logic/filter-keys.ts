import { getContainerKeys, getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import type { QueryMatcher } from '../../GlobalSearch/types';
import { matchesSearch } from '../state-search';
import { toFilterType } from './sort-keys';

/** Without the keys of the hidden types */
export function filterKeysByType<K extends string | number>(
  keys: K[],
  getType: (key: K) => ValueType,
  hiddenTypes: readonly ValueType[],
): K[] {
  if (!hiddenTypes.length) return keys;
  return keys.filter((key) => !hiddenTypes.includes(toFilterType(getType(key))));
}

/**
 * How many of the values in a container the filter of types and the search hide: 0 for what is
 * not a container
 */
export function countHiddenKeys(
  container: JSONSafeValue,
  hiddenTypes: readonly ValueType[],
  searchMatcher?: QueryMatcher,
): number {
  const type = getJsonType(container);
  if ((!hiddenTypes.length && !searchMatcher) || !isContainerType(type)) return 0;
  const keys = getContainerKeys(container, type);
  const getType = (key: string | number) => getJsonType((container as JSONSafeObject)[key]);
  const keysOfType = filterKeysByType(keys, getType, hiddenTypes);
  const shown = searchMatcher
    ? keysOfType.filter((key) => matchesSearch(searchMatcher, container, key))
    : keysOfType;
  return keys.length - shown.length;
}
