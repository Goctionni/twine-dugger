import { jsonEqual } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';
import type {
  JSONSafeValue,
  Lock,
  LockRevert,
  ObjectValue,
  Path,
  Value,
} from '@/shared/shared-types';

import { resolveMapKey } from './map-keys';
import { posttransformValue } from './post-transform';
import { pretransformValue } from './pre-transform';
import { isObj } from './type-helpers';

function readChild(container: Value, key: string | number): [found: boolean, value: Value] {
  if (container instanceof Map) return [true, container.get(resolveMapKey(container, key))];
  if (Array.isArray(container)) return [Number(key) <= container.length, container[Number(key)]];
  if (!isObj(container) || container instanceof Set) return [false, undefined];
  return [true, (container as Record<string | number, Value>)[key]];
}

function findLiveValue(root: Value, path: Path): [found: boolean, value: Value] {
  let value = root;
  for (const key of path) {
    const [found, child] = readChild(value, key);
    if (!found) return [false, undefined];
    value = child;
  }
  return [true, value];
}

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
      const id = pathKey(path);
      if (jsonEqual(attempted, value)) {
        lastBlocked.delete(id);
        continue;
      }

      if (!lastBlocked.has(id) || !jsonEqual(attempted, lastBlocked.get(id)))
        reverts.push({ path, attempted });
      lastBlocked.set(id, attempted);
      setState(path, posttransformValue(value));
    }

    return reverts;
  };
}
