import { getContainerKeys, getJsonType, isContainer, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import { toFilterType } from '../../../logic/sort-keys';

/** Whether a container holds a container that the filter of types does not hide: a row of the tree to open */
export function hasContainerChild(container: JSONSafeValue, hiddenTypes: readonly ValueType[]) {
  const type = getJsonType(container);
  if (!isContainerType(type)) return false;

  return getContainerKeys(container, type).some((key) => {
    const child = (container as JSONSafeObject)[key];
    return isContainer(child) && !hiddenTypes.includes(toFilterType(getJsonType(child)));
  });
}
