import type {
  AddedDelta,
  ArrayDelta,
  DeletedDelta,
  Delta,
  ModifiedDelta,
  MovedDelta,
  ObjectDelta,
  TextDiffDelta,
} from 'jsondiffpatch';

import { getJsonType, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import type { DiffChange } from '../views/DiffLog/diff-types';

// jsondiffpatch has these functions, but does not export them correctly. Hence why they're implemented here
const isObject = (value: unknown): value is object =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const isTupleOf = (value: unknown, size: number): value is unknown[] =>
  Array.isArray(value) && value.length === size;

const isAddedDelta = (delta: Delta): delta is AddedDelta => isTupleOf(delta, 1);
const isModifiedDelta = (delta: Delta): delta is ModifiedDelta => isTupleOf(delta, 2);
const isDeletedDelta = (delta: Delta): delta is DeletedDelta =>
  isTupleOf(delta, 3) && delta[2] === 0 && delta[1] === 0;
const isArrayDelta = (delta: Delta): delta is ArrayDelta =>
  isObject(delta) && '_t' in delta && delta._t === 'a';
const isObjectDelta = (delta: Delta): delta is ObjectDelta => isObject(delta);
const isMovedDelta = (delta: Delta): delta is MovedDelta =>
  isTupleOf(delta, 3) && delta[2] === 3 && typeof delta[1] === 'number';
const isTextDiffDelta = (delta: Delta): delta is TextDiffDelta =>
  isTupleOf(delta, 3) && delta[2] === 2 && delta[1] === 0 && typeof delta[0] === 'string';

function walkDelta(delta: Delta) {
  const changes: DiffChange[] = [];

  const walk = (node: Delta, path: Path) => {
    if (!node) return changes;

    if (isAddedDelta(node)) {
      changes.push({ kind: 'add', path, value: node[0] as JSONSafeValue });
    } else if (isModifiedDelta(node)) {
      const [oldValue, newValue] = node as [JSONSafeValue, JSONSafeValue];
      const kind = getJsonType(oldValue) === getJsonType(newValue) ? 'chg' : 'typ';
      changes.push({ kind, path, oldValue, newValue });
    } else if (isDeletedDelta(node)) {
      changes.push({ kind: 'del', path, value: node[0] as JSONSafeValue });
    } else if (isObjectDelta(node)) {
      let hasMoves = false;
      const isArray = isArrayDelta(node);
      const keys = Object.keys(node);
      for (const rawKey of keys) {
        if (rawKey === '_t' || rawKey === TYPE_KEY) continue;
        const key = isArray ? Number(rawKey.replace('_', '')) : rawKey;
        const childNode = node[rawKey];
        if (isMovedDelta(childNode)) {
          hasMoves = true;
        } else {
          walk(node[rawKey], [...path, key]);
        }
      }

      if (hasMoves) changes.push({ kind: 'mov', path });
    } else if (isMovedDelta(node)) {
      console.warn("[TwineDugger]: diffFromDelta detected a MovedDelta where it shouldn't have.");
    } else if (isTextDiffDelta(node)) {
      console.warn(
        '[TwineDugger]: diffFromDelta detected a TextDiffDelta, whilst TextDiffing should be disabled.',
      );
    } else {
      console.warn('[TwineDugger]: diffFromDelta was unable to determine the type of delta.', node);
    }
  };

  walk(delta, []);

  return changes;
}

const diffs = new WeakMap<object, DiffChange[]>();

export function getDiffFromDelta(delta: Delta): DiffChange[] {
  if (!delta) return [];

  return diffs.getOrInsertComputed(delta, () => walkDelta(delta));
}
