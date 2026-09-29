import { jsonEqual } from '@/shared/json-safe';
import type { Lock, LockRevert, ObjectValue, Path, Value } from '@/shared/shared-types';

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
 * Makes sure the value at the path of every lock is the locked value, and reports what it undid.
 * A lock whose path doesn't exist is left alone until it does.
 */
export function enforceLocks(
  locks: Lock[],
  getState: () => ObjectValue,
  setState: (path: Path, value: unknown) => void,
): LockRevert[] {
  const reverts: LockRevert[] = [];

  for (const { path, value } of locks) {
    const [found, live] = findLiveValue(getState(), path);
    if (!found) continue;

    const attempted = pretransformValue(live, new Map(), new Map());
    if (jsonEqual(attempted, value)) continue;

    reverts.push({ path, attempted });
    setState(path, posttransformValue(value));
  }

  return reverts;
}
