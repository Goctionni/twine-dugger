import { getContainerKeys, getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, Path, ValueType } from '@/shared/shared-types';

import { countColumns } from './count-columns';
import { TYPE_ORDER, toFilterType } from './sort-keys';

/** The types of the values in the Miller columns that the path shows, in the order of the types */
export function getTypesInColumns(state: JSONSafeValue, path: Path): ValueType[] {
  const found = new Set<ValueType>();
  const columns = countColumns(state, path);
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
