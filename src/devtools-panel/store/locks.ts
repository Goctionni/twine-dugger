import { createMemo, createRoot, flush, snapshot, untrack } from 'solid-js';

import { containsFunction, getPathValue } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { Lock, Path } from '@/shared/shared-types';

import { setStatePropertyLocks } from '../api/api';
import { getLatestState } from './game-state';
import { setStore, store } from './store';

// A lock is a path and the value the path is kept at. The panel decides the value, so restoring
// the locks after the game was reloaded is the same call as setting one.

export const getLockedPaths = createRoot(() =>
  createMemo(() => store.gameConfig.locks.map((lock) => lock.path)),
);

const currentLocks = (): Lock[] => untrack(() => snapshot(store.gameConfig.locks));
const getLatestValue = (path: Path) =>
  untrack(() => snapshot(getPathValue(getLatestState(), path)));

export function isPathLockable(path: Path) {
  const value = getLatestValue(path);
  return value !== undefined && !containsFunction(value);
}

function setLocks(locks: Lock[]) {
  setStore((draft) => {
    draft.gameConfig.locks = locks;
  });
  // Store writes wait for the end of the current task, and the next change starts from these locks
  flush();
  return setStatePropertyLocks(locks);
}

export function setPathLock(path: Path, lock: boolean) {
  const locks = currentLocks().filter((current) => !pathEquals(current.path, path));
  if (lock) {
    const value = getLatestValue(path);
    if (value === undefined) throw new Error('Cannot lock a path that has no value');
    if (containsFunction(value)) throw new Error('Cannot lock a value that contains a function');
    locks.push({ path: [...path], value: structuredClone(value) });
  }
  return setLocks(locks);
}

export const clearLocks = () => setLocks([]);

export const syncLocks = () => setStatePropertyLocks(currentLocks());
