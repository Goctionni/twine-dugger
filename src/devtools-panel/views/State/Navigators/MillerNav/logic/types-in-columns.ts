import { getContainerKeys, getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import type { JSONSafeContainer, JSONSafeObject, Path, ValueType } from '@/shared/shared-types';

import { TYPE_ORDER, toFilterType } from '../../../logic/sort-keys';
import { countColumns } from './count-columns';

/** The types of the values in the Miller columns that the path shows, in the order of the types */
export function getTypesInColumns(state: JSONSafeContainer, path: Path): ValueType[] {
  const found = new Set<ValueType>();
  // A column that the filter removes holds only hidden types, and those are listed anyway
  const columns = countColumns(state, path, []);
  for (let depth = 0; depth < columns; depth++) {
    const container = getPathValue(state, path.slice(0, depth));
    const type = getJsonType(container);
    if (!isContainerType(type)) continue;
    for (const key of getContainerKeys(container, type)) {
      found.add(toFilterType(getJsonType((container as JSONSafeObject)[key])));
    }
  }
  return TYPE_ORDER.filter((type) => found.has(type));
}
