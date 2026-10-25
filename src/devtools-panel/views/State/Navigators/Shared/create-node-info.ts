import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import type { Range } from '../../../GlobalSearch/types';
import { getSearchMatcher } from '../../state-search';
import { getChildCounts, sameChildCounts } from './get-child-counts';
import { getNodeName } from './get-node-name';

const NO_RANGES: Range[] = [];
const sameRanges = (a: Range[], b: Range[]) =>
  a.length === b.length && a.every(([start, end], i) => start === b[i]![0] && end === b[i]![1]);

/** What a row or a tile says of the value at a path: the value, its type, its name, its counts */
export function createNodeInfo(getPath: () => Path) {
  const getValue = () => getPathValue(getLatestState(), getPath());
  const getType = createMemo(() => getJsonType(getValue()));

  const getName = () => getNodeName(getLatestState(), getPath());
  // Read in several places, and each reading is a pass over the values of the container
  const getCounts = createMemo(() => getChildCounts(getValue()), { equals: sameChildCounts });

  // Like the search, only a name counts (an object or a map), and only a string, number or boolean
  const getNameRanges = createMemo(
    () => {
      const queryMatcher = getSearchMatcher();
      const path = getPath();
      if (!queryMatcher || !path.length) return NO_RANGES;
      const parentType = getJsonType(getPathValue(getLatestState(), path.slice(0, -1)));
      return parentType === 'object' || parentType === 'map'
        ? queryMatcher.ranges(getName())
        : NO_RANGES;
    },
    { equals: sameRanges },
  );

  // For the preview of the value. A string is shown in quotes, which moves what is in them by one;
  // an escaped character is longer than it is, so a match after one is a little off
  const getValueRanges = createMemo(
    () => {
      const queryMatcher = getSearchMatcher();
      const type = getType();
      if (!queryMatcher || !(type === 'string' || type === 'number' || type === 'boolean')) {
        return NO_RANGES;
      }
      const ranges = queryMatcher.ranges(String(getValue() as string | number | boolean));
      return type === 'string'
        ? ranges.map(([start, end]) => [start + 1, end + 1] as const)
        : ranges;
    },
    { equals: sameRanges },
  );

  return { getValue, getType, getName, getCounts, getNameRanges, getValueRanges };
}
