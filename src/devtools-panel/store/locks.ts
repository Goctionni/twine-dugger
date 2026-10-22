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

const findLock = (path: Path) => store.gameConfig.locks.find((lock) => pathEquals(lock.path, path));

/** The bounds of a locked number: the number itself, on both sides, when it has no range */
export function getLockRange(path: Path): { min: number; max: number } | undefined {
  const lock = findLock(path);
  if (typeof lock?.value !== 'number') return undefined;
  return { min: lock.min ?? lock.value, max: lock.max ?? lock.value };
}

/** Changes the bounds of the lock of a number. What is outside them is moved in by the game's next poll */
export function setLockRange(path: Path, min: number, max: number) {
  if (min > max) throw new Error('The minimum cannot be above the maximum');
  const locks = currentLocks().map((lock) => {
    if (!pathEquals(lock.path, path) || typeof lock.value !== 'number') return lock;
    return { ...lock, value: Math.min(Math.max(lock.value, min), max), min, max };
  });
  return setLocks(locks);
}

/** Locks (or unlocks) the paths in one go. Paths that have no value to lock are left out */
export function setPathLocks(paths: readonly Path[], lock: boolean) {
  const locks = currentLocks().filter(
    (current) => !paths.some((path) => pathEquals(current.path, path)),
  );
  if (lock) {
    for (const path of paths) {
      const value = getLatestValue(path);
      if (value === undefined || containsFunction(value)) continue;
      locks.push({ path: [...path], value: structuredClone(value) });
    }
  }
  return setLocks(locks);
}
