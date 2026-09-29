import { jsonEqual } from '@/shared/json-safe';
import type {
  JSONSafeValue,
  Lock,
  LockRevert,
  ObjectValue,
  Path,
  Value,
} from '@/shared/shared-types';

import { posttransformValue } from './post-transform';
import { pretransformValue } from './pre-transform';

/** Looks up a value in the live state; a path that doesn't exist (yet) is not an error */
function findLiveValue(root: Value, path: Path): [found: boolean, value: Value] {
  let value = root;
  for (const key of path) {
    if (value instanceof Map) {
      if (!value.has(`${key}`)) return [false, undefined];
      value = value.get(`${key}`) as Value;
    } else if (value && typeof value === 'object' && !(value instanceof Set)) {
      if (!Object.hasOwn(value, key)) return [false, undefined];
      value = (value as Record<string | number, Value>)[key];
    } else {
      return [false, undefined];
    }
  }
  return [true, value];
}

/**
 * Makes sure the value at the path of every lock is the locked value, and reports the writes that
 * it undid. A game that keeps trying the same write is only reported the first time. A lock whose
 * path doesn't exist is left alone until it does.
 */
export function createLockEnforcer(
  getState: () => ObjectValue,
  setState: (path: Path, value: unknown) => void,
) {
  let lastLocks: Lock[] = [];
  let lastBlocked = new Map<string, JSONSafeValue>();

  return (locks: Lock[]): LockRevert[] => {
    if (locks !== lastLocks) {
      lastLocks = locks;
      lastBlocked = new Map();
    }
    const reverts: LockRevert[] = [];

    for (const { path, value } of locks) {
      const [found, live] = findLiveValue(getState(), path);
      if (!found) continue;

      const attempted = pretransformValue(live, new Map(), new Map());
      const id = JSON.stringify(path);
      if (jsonEqual(attempted, value)) {
        lastBlocked.delete(id);
        continue;
      }

      if (!jsonEqual(attempted, lastBlocked.get(id))) reverts.push({ path, attempted });
      lastBlocked.set(id, attempted);
      setState(path, posttransformValue(value));
    }

    return reverts;
  };
}
