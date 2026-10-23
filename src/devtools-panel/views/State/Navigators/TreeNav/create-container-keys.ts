import { createMemo, getOwner, runWithOwner, type Accessor } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { isPinned } from '@/devtools-panel/store/store';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import { getVisibleKeys } from '../Shared/visible-keys';

/**
 * The keys of the containers of the tree, as the tree shows them. Each container has a memo of its
 * own, so that when something in one container changes only that container is sorted again, and
 * not every container that is open.
 */
export function createContainerKeys() {
  // The memos are made while the rows are worked out, which is itself a computation: they belong
  // to the tree, or they would be thrown away with every pass
  const owner = getOwner();
  const memos = new Map<string, Accessor<Array<string | number>>>();

  return (containerPath: Path) =>
    memos.getOrInsertComputed(pathKey(containerPath), () =>
      runWithOwner(owner, () =>
        createMemo(
          () =>
            getVisibleKeys(
              getPathValue(getLatestState(), containerPath),
              getSort(),
              getHiddenTypes(),
              (key) => getLastChangeId([...containerPath, key]),
              (key) => isPinned([...containerPath, key]),
            ),
          { equals: sameItems },
        ),
      ),
    )();
}
