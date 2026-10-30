import { getContainerSize, isContainer } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { countHiddenKeys } from '../../logic/filter-keys';
import { getSearchMatcher } from '../../state-search';
import { getHiddenKeyCheck, getHiddenTypes } from '../../store-helpers/view-prefs';

type ChildCounts = { shown: number; hidden: number };

export const sameChildCounts = (a: ChildCounts | undefined, b: ChildCounts | undefined) =>
  a?.shown === b?.shown && a?.hidden === b?.hidden;

/**
 * What a row says about the values in a container: how many are shown, and how many the filter
 * of types, the search and the filtered paths hide. Nothing for a value that is not a container.
 */
export function getChildCounts(value: JSONSafeValue, path: Path): ChildCounts | undefined {
  if (!isContainer(value)) return undefined;
  const hidden = countHiddenKeys(
    value,
    getHiddenTypes(),
    getSearchMatcher(),
    getHiddenKeyCheck(path),
  );
  return { shown: getContainerSize(value) - hidden, hidden };
}
