import type { Delta } from 'jsondiffpatch';

import type { ContainerType } from '@/shared/json-safe';
import { getJsonType, isContainerType, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

interface ChangeBase {
  /** Full path to the changed value */
  path: Path;
  /** Container type of each ancestor: `kinds[i]` is the type of the container holding `path[i]` */
  kinds: ContainerType[];
}

export type DiffChange =
  | (ChangeBase & { kind: 'add'; value: JSONSafeValue })
  | (ChangeBase & { kind: 'del'; value: JSONSafeValue })
  | (ChangeBase & { kind: 'chg' | 'typ'; oldValue: JSONSafeValue; newValue: JSONSafeValue })
  | (ChangeBase & { kind: 'mov' })
  /** The game changed a locked path and the change was undone */
  | (ChangeBase & { kind: 'lock'; attempted: JSONSafeValue; locked: JSONSafeValue })
  /** The game was reloaded, so the state and history start over */
  | (ChangeBase & { kind: 'reload' });

/** The container type of each ancestor of `path`, as far as the path exists in `state` */
export function getPathKinds(state: unknown, path: Path): ContainerType[] {
  const kinds: ContainerType[] = [];
  let value = state;
  for (const key of path) {
    const type = getJsonType(value);
    if (!isContainerType(type)) break;
    kinds.push(type);
    value = (value as Record<string | number, unknown>)[key];
  }
  return kinds;
}

type DeltaNode = Record<string, unknown>;

const isDeltaLeaf = (node: unknown): node is unknown[] => Array.isArray(node);

/**
 * Flattens a jsondiffpatch delta into a list of changes.
 * `newState` is the state *after* the delta was applied; it's used to find out what kind of
 * containers the changes happened in (array indices in a delta are positions in the new array).
 */
export function flattenDelta(delta: Delta, newState: unknown): DiffChange[] {
  const out: DiffChange[] = [];
  walk(delta as DeltaNode, newState, [], [], out);
  return out;
}

function walk(
  delta: DeltaNode,
  state: unknown,
  path: Path,
  kinds: ContainerType[],
  out: DiffChange[],
) {
  const type = getJsonType(state);

  // Functions and dates are stored as small objects; report them as one change
  if ((type === 'function' || type === 'date') && !isDeltaLeaf(delta)) {
    const oldValue = { ...(state as object) } as Record<string, JSONSafeValue>;
    const newValue = { ...(state as object) } as Record<string, JSONSafeValue>;
    for (const [key, part] of Object.entries(delta)) {
      if (isDeltaLeaf(part) && part.length === 2) oldValue[key] = part[0] as JSONSafeValue;
    }
    out.push({ kind: 'chg', path, kinds, oldValue, newValue });
    return;
  }

  if (!isContainerType(type)) return;
  const childKinds = [...kinds, type];
  let hasMoves = false;

  for (const [rawKey, node] of Object.entries(delta)) {
    if (rawKey === '_t' || rawKey === TYPE_KEY) continue;

    const isArrayLike = type === 'array' || type === 'set';
    if (isArrayLike && rawKey.startsWith('_')) {
      // Items removed from, or moved within, the old array. Indices are old positions.
      const leaf = node as unknown[];
      if (leaf[2] === 3) hasMoves = true;
      else
        out.push({
          kind: 'del',
          path: [...path, Number(rawKey.slice(1))],
          kinds: childKinds,
          value: leaf[0] as JSONSafeValue,
        });
      continue;
    }

    const key = isArrayLike ? Number(rawKey) : rawKey;
    const childPath = [...path, key];
    const child = (state as Record<string | number, unknown>)?.[key];

    if (!isDeltaLeaf(node)) {
      walk(node as DeltaNode, child, childPath, childKinds, out);
    } else if (node.length === 1) {
      out.push({
        kind: 'add',
        path: childPath,
        kinds: childKinds,
        value: node[0] as JSONSafeValue,
      });
    } else if (node.length === 3 && node[1] === 0 && node[2] === 0) {
      out.push({
        kind: 'del',
        path: childPath,
        kinds: childKinds,
        value: node[0] as JSONSafeValue,
      });
    } else if (node.length === 2) {
      const [oldValue, newValue] = node as [JSONSafeValue, JSONSafeValue];
      const kind = getJsonType(oldValue) === getJsonType(newValue) ? 'chg' : 'typ';
      out.push({ kind, path: childPath, kinds: childKinds, oldValue, newValue });
    }
  }

  if (hasMoves) out.push({ kind: 'mov', path, kinds });
}
