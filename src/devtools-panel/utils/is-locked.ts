import { LockStatus, Path } from '@/shared/shared-types';

export function getLockStatus(getPath: () => Path, getLockedPaths: () => Path[]): LockStatus {
  const path = getPath();
  const lockedPaths = getLockedPaths().map((lockedPath) => lockedPath.join('\u0000'));
  const pathStr = path.join('\u0000');
  if (lockedPaths.includes(pathStr)) return 'locked';

  for (let i = 1; i <= path.length; i++) {
    const subPath = path.slice(0, i);
    const subPathStr = subPath.join('\u0000');
    if (lockedPaths.includes(subPathStr)) return 'ancestor-lock';
  }
  return 'unlocked';
}
