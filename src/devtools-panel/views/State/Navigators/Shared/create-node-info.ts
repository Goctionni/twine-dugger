import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getContainerKeyLabel, getJsonType, getPathValue, isContainer } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getChildCounts, sameChildCounts } from './get-child-counts';

/** What a row or a tile says of the value at a path: the value, its type, its name, its counts */
export function createNodeInfo(getPath: () => Path) {
  const getValue = () => getPathValue(getLatestState(), getPath());
  const getType = createMemo(() => getJsonType(getValue()));

  const getName = () => {
    const container = getPathValue(getLatestState(), getPath().slice(0, -1));
    const key = getPath().at(-1)!;
    return isContainer(container) ? getContainerKeyLabel(container, key) : String(key);
  };
  // Read in several places, and each reading is a pass over the values of the container
  const getCounts = createMemo(() => getChildCounts(getValue()), { equals: sameChildCounts });

  return { getValue, getType, getName, getCounts };
}
