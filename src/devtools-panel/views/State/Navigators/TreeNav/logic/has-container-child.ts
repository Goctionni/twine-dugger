import { getContainerKeys, getJsonType, isContainer, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, ValueType } from '@/shared/shared-types';

import type { QueryMatcher } from '../../../../GlobalSearch/types';
import { isKeyShown } from '../../../logic/filter-keys';

/**
 * Whether a container holds a container that the filter of types, the search and the filtered
 * paths do not hide: a row of the tree to open
 */
export function hasContainerChild(
  container: JSONSafeValue,
  hiddenTypes: readonly ValueType[],
  searchMatcher?: QueryMatcher,
  isPathHidden?: (key: string | number) => boolean,
) {
  const type = getJsonType(container);
  if (!isContainerType(type)) return false;

  return getContainerKeys(container, type).some((key) => {
    const child = (container as JSONSafeObject)[key];
    return (
      isContainer(child) &&
      isKeyShown(container, key, () => getJsonType(child), hiddenTypes, searchMatcher, isPathHidden)
    );
  });
}
