import { getContainerSize, isContainer } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, Path } from '@/shared/shared-types';

/**
 * One column for the root and for every non-empty container below it on the path, and one for the
 * selected container: a value that is not a container has no column. Only reads the containers and
 * the keys on the path, so it is cheap to read in a memo.
 */
export function countColumns(state: JSONSafeValue, path: Path): number {
  let value = state;
  for (let depth = 0; ; depth++) {
    if (!isContainer(value) || getContainerSize(value) === 0) return depth;
    if (depth === path.length) return depth + 1;
    value = (value as JSONSafeObject)[path[depth]!];
  }
}
