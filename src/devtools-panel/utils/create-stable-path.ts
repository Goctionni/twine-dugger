import { createMemo } from 'solid-js';

import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

/**
 * The selected path as a plain array that only changes when the path does. Setting the same path
 * again gives a new array in the store, and that is not a different value to read or to edit.
 */
export function createStablePath(getPath: () => Path) {
  return createMemo(() => getPath().slice(), { equals: pathEquals });
}
