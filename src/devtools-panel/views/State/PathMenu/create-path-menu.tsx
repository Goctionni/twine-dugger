import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths } from '@/devtools-panel/store/locks';
import { showInStatePage } from '@/devtools-panel/store/state-location';
import { addFilteredPath, isPathFiltered, isPinned, togglePin } from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { createContextMenuHandler } from '@/devtools-panel/ui/util/ContextMenu';
import type { Path } from '@/shared/shared-types';

import { createEditStatus } from '../Inspector/createEditStatus';
import { getLockStatus, isInsideSet } from '../Inspector/logic/edit-status';
import { deleteValue } from '../Inspector/ValueHeader/deleteValue';
import { getNodeName } from '../logic/get-node-name';
import { duplicateValue } from './duplicate-value';

/**
 * The right-click menu of the value at a path: lock, pin, filter, duplicate and delete. A list of
 * values that is not the State view (the search) leaves out the last two with `canReshape: false`,
 * and starts with "Show in State view" with `canShowInState`.
 */
export function createPathMenu(
  getPath: () => Path,
  options: { canReshape?: boolean; canShowInState?: boolean } = {},
) {
  const { getStatus, canDelete, canToggleLock, toggleLock } = createEditStatus(getPath);

  // A copy is a new value in the parent: not in a set, and not in a container that is held
  const canDuplicate = () =>
    getLockStatus(getPath().slice(0, -1), getLockedPaths()) === 'unlocked' &&
    !isInsideSet(getLatestState(), getPath());

  return createContextMenuHandler(
    () =>
      // The state itself has nothing to lock, pin, copy or delete
      getPath().length === 0
        ? []
        : [
            ...(options.canShowInState
              ? [
                  {
                    label: 'Show in State view',
                    onClick: () => showInStatePage(getPath()),
                  },
                ]
              : []),
            {
              label: getStatus() === 'locked' ? 'Unlock' : 'Lock',
              disabled: !canToggleLock(),
              onClick: () => void toggleLock(),
            },
            {
              label: isPinned(getPath()) ? 'Unpin' : 'Pin',
              onClick: () => togglePin(getPath()),
            },
            {
              label: 'Filter path',
              disabled: isPathFiltered(getPath()),
              onClick: () => addFilteredPath(getPath()),
            },
            ...(options.canReshape === false
              ? []
              : [
                  {
                    label: 'Duplicate',
                    disabled: !canDuplicate(),
                    onClick: () => void duplicateValue(getPath()),
                  },
                  {
                    label: 'Delete',
                    disabled: !canDelete(),
                    onClick: () => {
                      const path = getPath();
                      void deleteValue(path, getNodeName(getLatestState(), path));
                    },
                  },
                ]),
          ],
    () => <PrettyPath path={getPath()} statePrefix />,
  );
}
