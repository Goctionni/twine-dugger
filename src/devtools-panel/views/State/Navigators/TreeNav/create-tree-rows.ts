import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getPathValue } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { getSearchMatcher } from '../../state-search';
import { getHiddenTypes } from '../../store-helpers/view-prefs';
import { getChildCounts } from '../Shared/get-child-counts';
import type { createTreeExpansion } from './create-tree-expansion';
import type { createValueList } from './create-value-list';
import { getTreeRows, sameRows, type TreeRow } from './logic/get-tree-rows';
import { hasContainerChild } from './logic/has-container-child';

interface Options {
  getSelectedPath: () => Path;
  expansion: ReturnType<typeof createTreeExpansion>;
  list: ReturnType<typeof createValueList>;
  /** The keys of a container as the tree shows them */
  getKeysAt: (containerPath: Path) => Array<string | number>;
}

/** The rows of the tree, whether a row can be opened, and whether the selection has a row (or a value in the list) */
export function createTreeRows({ getSelectedPath, expansion, list, getKeysAt }: Options) {
  // A row that is still there stays the same object: only the rows that changed are worked out again
  const getRows = createMemo(
    (previous: TreeRow[] = []) => {
      const known = new Map(previous.map((row) => [row.id, row]));
      return getTreeRows(
        getLatestState(),
        expansion.isExpanded,
        getKeysAt,
        !list.hasValueList(),
      ).map((row) => known.get(row.id) ?? row);
    },
    { equals: sameRows },
  );

  // A container with rows to show. With the values in a list, only a container in it is a row
  const canOpen = (path: Path) => {
    const value = getPathValue(getLatestState(), path);
    return list.hasValueList()
      ? hasContainerChild(value, getHiddenTypes(), getSearchMatcher())
      : (getChildCounts(value)?.shown ?? 0) > 0;
  };

  const isSelectedRowShown = createMemo(() => {
    if (list.isValueSelected()) {
      return list.getValueKeysAt(list.getListedPath()!).includes(getSelectedPath().at(-1)!);
    }
    return getRows().some((row) => pathEquals(row.path, getSelectedPath()));
  });

  return { getRows, canOpen, isSelectedRowShown };
}
