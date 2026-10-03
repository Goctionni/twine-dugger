import { pathEquals, pathStartsWith } from '@/shared/path-equals';
import type { LockStatus, Path } from '@/shared/shared-types';

export function getLockStatus(getPath: () => Path, getLockedPaths: () => Path[]): LockStatus {
  const path = getPath();
  const lockedPaths = getLockedPaths();
  if (lockedPaths.some((lockedPath) => pathEquals(lockedPath, path))) return 'locked';
  if (lockedPaths.some((lockedPath) => pathStartsWith(path, lockedPath))) return 'ancestor-lock';
  return 'unlocked';
}
