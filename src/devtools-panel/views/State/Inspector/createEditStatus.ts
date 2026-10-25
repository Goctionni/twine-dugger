import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, isPathLockable, setPathLock } from '@/devtools-panel/store/locks';
import type { Path } from '@/shared/shared-types';

import { getLockStatus, hasLockInside, isInsideSet } from './logic/edit-status';

/** What an editor may do with the value at a path: it is locked, or locked by a parent, or in a set */
export function createEditStatus(getPath: () => Path) {
  const getStatus = () => getLockStatus(getPath(), getLockedPaths());
  // Locked by a parent, or in a set: not for this editor to change. Locked itself is only read only
  const isDisabled = () =>
    getStatus() === 'ancestor-lock' || isInsideSet(getLatestState(), getPath());
  // Locked values would be put back, and the items of a set cannot be named
  const canChange = () => getStatus() === 'unlocked' && !isDisabled();
  const hasLockedInside = () => hasLockInside(getPath(), getLockedPaths());
  // A container with a locked value inside can be changed, but not deleted as a whole
  const canDelete = () => canChange() && !hasLockedInside();
  const toggleLock = () => setPathLock(getPath(), getStatus() === 'unlocked');
  // A lock is always taken off. One is put on when the game can be held to the value: not for the
  // items of a set, and not for a value that holds a function
  const canToggleLock = () =>
    getStatus() === 'locked' ||
    (getStatus() === 'unlocked' && !isDisabled() && isPathLockable(getPath()));

  return {
    getStatus,
    isDisabled,
    canChange,
    canDelete,
    hasLockedInside,
    toggleLock,
    canToggleLock,
  };
}
