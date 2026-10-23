import { getContainerSize, isContainer } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { countHiddenKeys } from '../../logic/filter-keys';
import { getHiddenTypes } from '../../store-helpers/view-prefs';

type ChildCounts = { shown: number; hidden: number };

export const sameChildCounts = (a: ChildCounts | undefined, b: ChildCounts | undefined) =>
  a?.shown === b?.shown && a?.hidden === b?.hidden;

/**
 * What a row says about the values in a container: how many are shown, and how many the filter
 * of types hides. Nothing for a value that is not a container.
 */
export function getChildCounts(value: JSONSafeValue): ChildCounts | undefined {
  if (!isContainer(value)) return undefined;
  const hidden = countHiddenKeys(value, getHiddenTypes());
  return { shown: getContainerSize(value) - hidden, hidden };
}
