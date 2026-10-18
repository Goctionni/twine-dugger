import { getContainerKeys, getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import { filterKeysByType } from '../../logic/filter-keys';
import { getKeysByName, sortKeysByChanged, sortKeysByType } from '../../logic/sort-keys';
import type { Sort } from '../../types';

/** The keys of a container as the navigators show them: filtered, and in the order of the sort */
export function getVisibleKeys(
  container: JSONSafeValue,
  sort: Sort,
  hiddenTypes: readonly ValueType[],
  getLastChange: (key: string | number) => number,
): Array<string | number> {
  const type = getJsonType(container);
  if (!isContainerType(type)) return [];
  const getTypeOf = (key: string | number) => getJsonType((container as JSONSafeObject)[key]);

  const keys = filterKeysByType(
    sort === 'name' ? getKeysByName(container) : getContainerKeys(container, type),
    getTypeOf,
    hiddenTypes,
  );
  // The position is the name of an item of an array or a set
  if (type === 'array' || type === 'set' || sort === 'name') return keys;
  if (sort === 'changed') return sortKeysByChanged(keys, getLastChange);
  return sortKeysByType(keys, getTypeOf);
}
