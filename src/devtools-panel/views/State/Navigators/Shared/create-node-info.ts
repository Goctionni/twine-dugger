import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getChildCounts, sameChildCounts } from './get-child-counts';
import { getNodeName } from './get-node-name';

/** What a row or a tile says of the value at a path: the value, its type, its name, its counts */
export function createNodeInfo(getPath: () => Path) {
  const getValue = () => getPathValue(getLatestState(), getPath());
  const getType = createMemo(() => getJsonType(getValue()));

  const getName = () => getNodeName(getLatestState(), getPath());
  // Read in several places, and each reading is a pass over the values of the container
  const getCounts = createMemo(() => getChildCounts(getValue()), { equals: sameChildCounts });

  return { getValue, getType, getName, getCounts };
}
