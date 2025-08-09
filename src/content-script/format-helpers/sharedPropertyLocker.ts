import {
  ArrayValue,
  Diff,
  MapValue,
  ObjectValue,
  Path,
  ProcessDiffResult,
  Value,
} from '@/shared/shared-types';
import { getStateValue } from './shared';

type StateObj = ObjectValue | MapValue | ArrayValue;
export function createPropertyLocker(
  getStateFn: () => StateObj,
  setStateFn: (path: Path, value: unknown) => void,
) {
  const locks = new Map<string, Value>();
  const pathToStr = (path: Path) => JSON.stringify(path);
  const strToPath = (strPath: string) => JSON.parse(strPath) as Path;

  const addLock = (path: Path) => {
    const pathStr = pathToStr(path);
    if (locks.has(pathStr)) return;

    // Store a structured clone of the value in the lock store
    const state = getStateFn();
    const value = structuredClone(getStateValue(state, path));
    locks.set(pathStr, value);
  };

  const removeLock = (path: Path) => {
    const pathStr = pathToStr(path);
    if (!locks.has(pathStr)) return;
    locks.delete(pathStr);
  };

  const setPathLock = (path: Path, lock: boolean) => {
    if (lock) addLock(path);
    else removeLock(path);

    return [...locks.keys()].map((str) => strToPath(str));
  };

  const findLock = (path: Path) => {
    // Simplest is direct match, but if ancestor is locked, descendant is also locked
    for (let i = 1; i <= path.length; i++) {
      const subPath = path.slice(0, i);
      const pathStr = pathToStr(subPath);
      if (locks.has(pathStr)) return subPath;
    }
    return null;
  };

  const getFullDiffPath = (diff: Diff) => {
    if (diff.type === 'object' || diff.type === 'map') {
      return [...diff.path, diff.key];
    }
    if (diff.type === 'array' && diff.subtype !== 'instructions') {
      return [...diff.path, diff.index];
    }
    return diff.path;
  };

  const processDiffs = (base: Diff[]): ProcessDiffResult => {
    let locksDirty = false;
    const processedDiffs = base.filter((diff) => {
      const fullPath = getFullDiffPath(diff);

      // If this or a parent is locked, restore the value and exclude the diff
      const lockPath = findLock(fullPath);
      if (lockPath) {
        setStateFn(lockPath, locks.get(pathToStr(lockPath)));
        return false;
      }

      // It's not locked, but its a delete operation; and a descendant property is locked
      // We remove that lock as the object no longer exists
      if (diff.type === 'object' || diff.type === 'map' || diff.type === 'array') {
        if (diff.subtype === 'remove') {
          const prefixPathStr = pathToStr(fullPath).slice(0, -1) + ',';
          locks.keys().forEach((key) => {
            if (key.startsWith(prefixPathStr)) {
              locksDirty = true;
              locks.delete(key);
            }
          });
        }
      }
      return true;
    });

    return {
      diffs: processedDiffs,
      locksUpdate: locksDirty ? Array.from(locks.keys()).map((str) => strToPath(str)) : null,
    };
  };

  return { processDiffs, setPathLock };
}
