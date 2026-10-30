import { untrack } from 'solid-js';

import { getTypeVersion } from '@/devtools-panel/store/game-state';
import { getContainerKeys, getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import type { QueryMatcher } from '../../GlobalSearch/types';
import { matchesSearch } from '../state-search';
import { toFilterType } from './sort-keys';

const isTypeShown = (type: ValueType, hiddenTypes: readonly ValueType[]) =>
  !hiddenTypes.includes(toFilterType(type));

/** Without the keys of the hidden types */
export function filterKeysByType<K extends string | number>(
  keys: K[],
  getType: (key: K) => ValueType,
  hiddenTypes: readonly ValueType[],
): K[] {
  if (!hiddenTypes.length) return keys;
  return keys.filter((key) => isTypeShown(getType(key), hiddenTypes));
}

/**
 * Whether a key of a container is shown: the filter of types, the search and the filtered paths
 * all have to leave it. The one place that says so. `getType` is only asked when there are types to
 * hide, and tells how the type of the value is read (followed, or not).
 */
export function isKeyShown(
  container: JSONSafeValue,
  key: string | number,
  getType: () => ValueType,
  hiddenTypes: readonly ValueType[],
  searchMatcher?: QueryMatcher,
  isPathHidden?: (key: string | number) => boolean,
): boolean {
  return (
    (!hiddenTypes.length || isTypeShown(getType(), hiddenTypes)) &&
    (!searchMatcher || matchesSearch(searchMatcher, container, key)) &&
    !isPathHidden?.(key)
  );
}

/**
 * How many of the values in a container the filter of types, the search and the filtered paths
 * hide: 0 for what is not a container
 */
export function countHiddenKeys(
  container: JSONSafeValue,
  hiddenTypes: readonly ValueType[],
  searchMatcher?: QueryMatcher,
  isPathHidden?: (key: string | number) => boolean,
): number {
  const type = getJsonType(container);
  if ((!hiddenTypes.length && !searchMatcher && !isPathHidden) || !isContainerType(type)) return 0;
  const keys = getContainerKeys(container, type);
  getTypeVersion();
  const shown = keys.filter((key) =>
    isKeyShown(
      container,
      key,
      () => getJsonType(untrack(() => (container as JSONSafeObject)[key])),
      hiddenTypes,
      searchMatcher,
      isPathHidden,
    ),
  );
  return keys.length - shown.length;
}
