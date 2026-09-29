import type { Delta } from 'jsondiffpatch';

import { getJsonType, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

export type DiffChange =
  | { kind: 'add' | 'del'; path: Path; value: JSONSafeValue }
  | { kind: 'chg' | 'typ'; path: Path; oldValue: JSONSafeValue; newValue: JSONSafeValue }
  | { kind: 'mov'; path: Path };

// The parts of jsondiffpatch's delta format that are relied on:
//  - `[value]` is an added value, `[old, new]` a change and `[old, 0, 0]` a deleted value
//  - a nested object holds the changes inside an object or array; an array's has `_t: 'a'`
//  - in an array's delta `3` is the item that is at index 3 in the new array, and `_3` the one that
//    was at index 3 in the old array. Of those, `['', to, 3]` is an item that moved.
const MOVED = 3;

type DeltaNode = { [key: string]: unknown[] | DeltaNode };

function walkDelta(delta: DeltaNode): DiffChange[] {
  const changes: DiffChange[] = [];

  const walk = (node: DeltaNode, path: Path) => {
    const isArray = node._t !== undefined;
    let hasMoves = false;

    for (const [rawKey, entry] of Object.entries(node)) {
      if (rawKey === '_t' || rawKey === TYPE_KEY) continue;
      const childPath = [...path, isArray ? Number(rawKey.replace('_', '')) : rawKey];

      if (!Array.isArray(entry)) {
        walk(entry, childPath);
      } else if (entry[2] === MOVED) {
        hasMoves = true;
      } else if (entry.length === 1) {
        changes.push({ kind: 'add', path: childPath, value: entry[0] as JSONSafeValue });
      } else if (entry.length === 3) {
        changes.push({ kind: 'del', path: childPath, value: entry[0] as JSONSafeValue });
      } else {
        const [oldValue, newValue] = entry as [JSONSafeValue, JSONSafeValue];
        const kind = getJsonType(oldValue) === getJsonType(newValue) ? 'chg' : 'typ';
        changes.push({ kind, path: childPath, oldValue, newValue });
      }
    }

    if (hasMoves) changes.push({ kind: 'mov', path });
  };

  walk(delta, []);
  return changes;
}

const diffs = new WeakMap<object, DiffChange[]>();

/**
 * Lists what a delta says changed, with the full path to each change. A delta never changes, so
 * this is only worked out the first time it's asked for a delta.
 */
export function getDiffFromDelta(delta: Delta | undefined): DiffChange[] {
  if (!delta) return [];

  let diff = diffs.get(delta as object);
  if (!diff) {
    diff = walkDelta(delta as DeltaNode);
    diffs.set(delta as object, diff);
  }
  return diff;
}
