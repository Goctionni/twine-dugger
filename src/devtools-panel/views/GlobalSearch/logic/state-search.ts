import { pathKey } from '@/shared/path-equals';
import type { JSONSafeObject, ValueType } from '@/shared/shared-types';

import type { QueryMatcher, Range, StateMatcherHit, StateScope } from '../types';
import { walkState } from './state-walk';

const NO_RANGES: Range[] = [];
const shift = (ranges: Range[], by: number): Range[] =>
  by === 0 ? ranges : ranges.map(([start, end]) => [start + by, end + by] as const);

/**
 * Looks at every key and primitive value in `root`. A key only counts when it is a name (not an
 * array index or the position in a set), and a value only for strings, numbers and booleans.
 * Numbers are matched as the text they are written as.
 */
export function searchState(
  root: JSONSafeObject,
  queryMatcher: QueryMatcher,
  scope: StateScope,
): StateMatcherHit[] {
  const hits: StateMatcherHit[] = [];
  // Read once: the scope can be a store, and this runs for every entry of the state
  const { path: searchesPath, value: searchesValue } = scope;
  if (!searchesPath && !searchesValue) return hits;

  walkState(root, (entry) => {
    let pathRanges = NO_RANGES;
    if (searchesPath && entry.isName) {
      pathRanges = shift(queryMatcher.ranges(String(entry.key)), entry.keyOffset);
    }
    let valueRanges = NO_RANGES;
    if (searchesValue && entry.primitive !== undefined) {
      valueRanges = queryMatcher.ranges(String(entry.primitive));
    }
    if (!pathRanges.length && !valueRanges.length) return;

    hits.push({
      key: pathKey(entry.path),
      path: entry.path,
      pathText: entry.pathText,
      type: entry.type,
      value: entry.primitive,
      pathRanges,
      valueRanges,
    });
  });
  return hits;
}

/** How many hits there are of each type */
export function countTypes(hits: readonly StateMatcherHit[]): Partial<Record<ValueType, number>> {
  const counts: Partial<Record<ValueType, number>> = {};
  for (const { type } of hits) counts[type] = (counts[type] ?? 0) + 1;
  return counts;
}
