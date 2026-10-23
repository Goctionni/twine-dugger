import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';
import type { Path } from '@/shared/shared-types';

import { getLockStatus, isInsideSet } from './logic/edit-status';

/** What an editor may do with the value at a path: it is locked, or locked by a parent, or in a set */
export function createEditStatus(getPath: () => Path) {
  const getStatus = () => getLockStatus(getPath(), getLockedPaths());
  // Locked by a parent, or in a set: not for this editor to change. Locked itself is only read only
  const isDisabled = () =>
    getStatus() === 'ancestor-lock' || isInsideSet(getLatestState(), getPath());
  // Locked values would be put back, and the items of a set cannot be named
  const canChange = () => getStatus() === 'unlocked' && !isDisabled();
  const toggleLock = () => setPathLock(getPath(), getStatus() === 'unlocked');

  return { getStatus, isDisabled, canChange, toggleLock };
}
