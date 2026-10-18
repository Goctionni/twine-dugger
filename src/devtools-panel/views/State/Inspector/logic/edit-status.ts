import { getJsonType, isContainer } from '@/shared/json-safe';
import { pathEquals, pathStartsWith } from '@/shared/path-equals';
import type {
  JSONSafeContainer,
  JSONSafeObject,
  JSONSafeValue,
  LockStatus,
  Path,
} from '@/shared/shared-types';

/** Whether the path is locked itself, only by one of its parents, or not */
export function getLockStatus(path: Path, lockedPaths: readonly Path[]): LockStatus {
  if (lockedPaths.some((locked) => pathEquals(locked, path))) return 'locked';
  if (lockedPaths.some((locked) => pathStartsWith(path, locked))) return 'ancestor-lock';
  return 'unlocked';
}

/** The items of a set have no name to write to: nothing in a set can be set */
export function isInsideSet(state: JSONSafeContainer, path: Path): boolean {
  let value: JSONSafeValue = state;
  for (const key of path) {
    if (!isContainer(value)) return false;
    if (getJsonType(value) === 'set') return true;
    value = (value as JSONSafeObject)[key];
  }
  return false;
}
