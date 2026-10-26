import { untrack } from 'solid-js';

import { getTypeVersion } from '@/devtools-panel/store/game-state';
import { getContainerKeys, getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import type { QueryMatcher } from '../../../GlobalSearch/types';
import { isKeyShown } from '../../logic/filter-keys';
import {
  getKeysByName,
  pinnedFirst,
  sortKeysByChanged,
  sortKeysByType,
} from '../../logic/sort-keys';
import type { Sort } from '../../types';

/**
 * The keys of a container as the navigators show them: filtered (by type, by the text of the search
 * when there is a matcher, and by the filtered paths that are hidden), and in the order of the sort
 */
export function getVisibleKeys(
  container: JSONSafeValue,
  sort: Sort,
  hiddenTypes: readonly ValueType[],
  getLastChange: (key: string | number) => number,
  isPinned: (key: string | number) => boolean,
  searchMatcher?: QueryMatcher,
  isPathHidden?: (key: string | number) => boolean,
): Array<string | number> {
  const type = getJsonType(container);
  if (!isContainerType(type)) return [];
  // The values are read without being followed: the order only depends on their types, and the
  // type version says when one of them changed
  getTypeVersion();
  const getTypeOf = (key: string | number) =>
    getJsonType(untrack(() => (container as JSONSafeObject)[key]));

  const allKeys = sort.by === 'name' ? getKeysByName(container) : getContainerKeys(container, type);
  const keys =
    hiddenTypes.length || searchMatcher || isPathHidden
      ? allKeys.filter((key) =>
          isKeyShown(
            container,
            key,
            () => getTypeOf(key),
            hiddenTypes,
            searchMatcher,
            isPathHidden,
          ),
        )
      : allKeys;
  // The position is the name of an item of an array or a set, so they keep it
  if (type === 'array' || type === 'set') return keys;
  let sorted = keys;
  if (sort.by === 'changed') sorted = sortKeysByChanged(keys, getLastChange);
  else if (sort.by === 'type') sorted = sortKeysByType(keys, getTypeOf);
  return pinnedFirst(sort.isDescending ? sorted.toReversed() : sorted, isPinned);
}
