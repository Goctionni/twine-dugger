import { pathKey } from '@/shared/path-equals';
import type { JSONSafeObject, ValueType } from '@/shared/shared-types';

import { walkState } from './state-walk';
import type { Matcher, Range, StateHit, StateScope } from './types';

const NO_RANGES: Range[] = [];
const shift = (ranges: Range[], by: number): Range[] =>
  by === 0 ? ranges : ranges.map(([start, end]) => [start + by, end + by] as const);

/**
 * Looks at every key and primitive value in `root`. A key only counts when it is a name (not an
 * array index or the position in a set), and a value only for strings, numbers and booleans.
 * Numbers are matched as the text they are written as.
 */
export function searchState(root: JSONSafeObject, matcher: Matcher, scope: StateScope): StateHit[] {
  const hits: StateHit[] = [];
  if (!scope.path && !scope.value) return hits;

  walkState(root, (entry) => {
    let pathRanges = NO_RANGES;
    if (scope.path && entry.isName) {
      pathRanges = shift(matcher.ranges(String(entry.key)), entry.keyOffset);
    }
    let valueRanges = NO_RANGES;
    if (scope.value && entry.primitive !== undefined) {
      valueRanges = matcher.ranges(String(entry.primitive));
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
export function countTypes(hits: readonly StateHit[]): Partial<Record<ValueType, number>> {
  const counts: Partial<Record<ValueType, number>> = {};
  for (const { type } of hits) counts[type] = (counts[type] ?? 0) + 1;
  return counts;
}
