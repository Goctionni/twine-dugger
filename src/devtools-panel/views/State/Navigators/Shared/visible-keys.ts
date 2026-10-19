import { getContainerKeys, getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import { filterKeysByType } from '../../logic/filter-keys';
import {
  getKeysByName,
  pinnedFirst,
  sortKeysByChanged,
  sortKeysByType,
} from '../../logic/sort-keys';
import type { Sort } from '../../types';

/** The keys of a container as the navigators show them: filtered, and in the order of the sort */
export function getVisibleKeys(
  container: JSONSafeValue,
  sort: Sort,
  hiddenTypes: readonly ValueType[],
  getLastChange: (key: string | number) => number,
  isPinned: (key: string | number) => boolean,
): Array<string | number> {
  const type = getJsonType(container);
  if (!isContainerType(type)) return [];
  const getTypeOf = (key: string | number) => getJsonType((container as JSONSafeObject)[key]);

  const keys = filterKeysByType(
    sort === 'name' ? getKeysByName(container) : getContainerKeys(container, type),
    getTypeOf,
    hiddenTypes,
  );
  // The position is the name of an item of an array or a set, so they keep it
  if (type === 'array' || type === 'set') return keys;
  if (sort === 'name') return pinnedFirst(keys, isPinned);
  const sorted =
    sort === 'changed' ? sortKeysByChanged(keys, getLastChange) : sortKeysByType(keys, getTypeOf);
  return pinnedFirst(sorted, isPinned);
}
