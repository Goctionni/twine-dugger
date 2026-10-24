import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getSettings } from '@/devtools-panel/store/store';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue, isContainer } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { JSONSafeObject, Path } from '@/shared/shared-types';

import { createContainerMemos } from './create-container-memos';

/**
 * The layout with the containers in the tree and their values in a list beside it: whether it is
 * chosen, the container that the list shows, and the values of a container.
 * `getKeysAt` has the keys of a container as the tree shows them.
 */
export function createValueList(
  getSelectedPath: () => Path,
  getKeysAt: (containerPath: Path) => Array<string | number>,
) {
  const hasValueList = () => getSettings.state.treeLayout() === 'primitives-in-list';

  // The selected container, or the one that holds the selected value
  const getListedPath = createMemo(
    () => {
      if (!hasValueList()) return undefined;
      const path = getSelectedPath();
      return isContainer(getPathValue(getLatestState(), path)) ? path : path.slice(0, -1);
    },
    { equals: (a, b) => (a && b ? pathEquals(a, b) : a === b) },
  );

  const isValueSelected = () => {
    const listed = getListedPath();
    return listed !== undefined && !pathEquals(listed, getSelectedPath());
  };

  // The values of a container that are not containers
  const getValueKeysAt = createContainerMemos((containerPath) => {
    const container = getPathValue(getLatestState(), containerPath);
    return getKeysAt(containerPath).filter(
      (key) => !isContainer((container as JSONSafeObject)[key]),
    );
  }, sameItems);

  return { hasValueList, getListedPath, isValueSelected, getValueKeysAt };
}
