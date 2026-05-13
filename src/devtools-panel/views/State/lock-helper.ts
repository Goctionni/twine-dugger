import { LockStatus, Path } from '@/shared/shared-types';

function getPathKey(path: Path) {
  return path.join('\u0000');
}

export function createLockPathSet(lockedPaths: Path[]) {
  return new Set(lockedPaths.map(getPathKey));
}

function getLockStatusFromSet(path: Path, lockSet: Set<string>): LockStatus {
  const pathStr = getPathKey(path);
  if (lockSet.has(pathStr)) return 'locked';

  for (let i = 1; i <= path.length; i++) {
    if (lockSet.has(getPathKey(path.slice(0, i)))) return 'ancestor-lock';
  }
  return 'unlocked';
}

export function getLockStatus(
  pathOrGetter: Path | (() => Path),
  lockSetOrGetter: Set<string> | (() => Path[]),
): LockStatus {
  if (typeof pathOrGetter === 'function' && typeof lockSetOrGetter === 'function') {
    const path = pathOrGetter();
    const lockSet = createLockPathSet(lockSetOrGetter());
    return getLockStatusFromSet(path, lockSet);
  }

  return getLockStatusFromSet(pathOrGetter as Path, lockSetOrGetter as Set<string>);
}
