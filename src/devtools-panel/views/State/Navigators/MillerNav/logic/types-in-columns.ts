import { getPathValue } from '@/shared/json-safe';
import type { JSONSafeContainer, Path, ValueType } from '@/shared/shared-types';

import { TYPE_ORDER } from '../../../logic/sort-keys';
import { getTypesIn } from '../../Shared/get-types-in';
import { countColumns } from './count-columns';

/** The types of the values in the Miller columns that the path shows, in the order of the types */
export function getTypesInColumns(state: JSONSafeContainer, path: Path): ValueType[] {
  const found = new Set<ValueType>();
  // A column that the filter removes holds only hidden types, and those are listed anyway
  const columns = countColumns(state, path, []);
  for (let depth = 0; depth < columns; depth++) {
    getTypesIn(getPathValue(state, path.slice(0, depth))).forEach((type) => found.add(type));
  }
  return TYPE_ORDER.filter((type) => found.has(type));
}
