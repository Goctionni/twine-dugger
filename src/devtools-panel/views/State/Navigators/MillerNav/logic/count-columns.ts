import { getContainerSize, isContainer } from '@/shared/json-safe';
import type {
  JSONSafeContainer,
  JSONSafeObject,
  JSONSafeValue,
  Path,
  ValueType,
} from '@/shared/shared-types';

import type { QueryMatcher } from '../../../../GlobalSearch/types';
import { countHiddenKeys } from '../../../logic/filter-keys';

/**
 * One column for the root and for every container below it on the path that has something to show,
 * and one for the selected container: a value that is not a container has no column, and neither has
 * a container that is empty or whose values are all hidden by the filter. Only reads the containers
 * and the keys on the path (and the types of their values, when something is hidden), so it is
 * cheap to read in a memo.
 */
export function countColumns(
  state: JSONSafeContainer,
  path: Path,
  hiddenTypes: readonly ValueType[],
  searchMatcher?: QueryMatcher,
): number {
  let value: JSONSafeValue = state;
  for (let depth = 0; ; depth++) {
    if (
      !isContainer(value) ||
      getContainerSize(value) - countHiddenKeys(value, hiddenTypes, searchMatcher) === 0
    ) {
      return depth;
    }
    if (depth === path.length) return depth + 1;
    value = (value as JSONSafeObject)[path[depth]!];
  }
}
