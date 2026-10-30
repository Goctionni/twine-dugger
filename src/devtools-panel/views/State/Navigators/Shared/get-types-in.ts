import { untrack } from 'solid-js';

import { getTypeVersion } from '@/devtools-panel/store/game-state';
import { getContainerKeys, getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import { TYPE_ORDER, toFilterType } from '../../logic/sort-keys';

/** The types of the values in a container (all of them, also the ones the filter hides), in the order of the types */
export function getTypesIn(container: JSONSafeValue): ValueType[] {
  const type = getJsonType(container);
  if (!isContainerType(type)) return [];

  // The values are read without being followed: only a change of a type matters
  getTypeVersion();
  const found = new Set<ValueType>();
  for (const key of getContainerKeys(container, type)) {
    found.add(toFilterType(getJsonType(untrack(() => (container as JSONSafeObject)[key]))));
  }
  return TYPE_ORDER.filter((candidate) => found.has(candidate));
}
