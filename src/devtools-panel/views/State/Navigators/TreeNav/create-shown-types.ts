import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue, isContainerType } from '@/shared/json-safe';
import type { Path, ValueType } from '@/shared/shared-types';

import { TYPE_ORDER } from '../../logic/sort-keys';
import { getTypesIn } from '../Shared/get-types-in';
import { createContainerMemos } from './create-container-memos';
import type { TreeRow } from './logic/get-tree-rows';

interface Options {
  getRows: () => TreeRow[];
  isExpanded: (id: string) => boolean;
  hasValueList: () => boolean;
  getListedPath: () => Path | undefined;
}

/**
 * The types that the tree shows, for the filter of types in the toolbar: those of the values in the
 * state itself and in the containers that are open. With the values in a list, the containers are
 * in the tree and the other values in the list.
 */
export function createShownTypes({ getRows, isExpanded, hasValueList, getListedPath }: Options) {
  const getTypesAt = createContainerMemos(
    (containerPath) => getTypesIn(getPathValue(getLatestState(), containerPath)),
    sameItems,
  );

  return createMemo(
    () => {
      const found = new Set<ValueType>();
      const addTypesOf = (containerPath: Path, wanted: (type: ValueType) => boolean) =>
        getTypesAt(containerPath).forEach((type) => wanted(type) && found.add(type));

      const inTree = hasValueList() ? isContainerType : () => true;
      addTypesOf([], inTree);
      for (const row of getRows()) {
        if (isExpanded(row.id)) addTypesOf(row.path, inTree);
      }
      const listed = getListedPath();
      if (listed) addTypesOf(listed, (type) => !isContainerType(type));

      return TYPE_ORDER.filter((type) => found.has(type));
    },
    { equals: sameItems },
  );
}
