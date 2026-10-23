import { expect, it } from 'vite-plus/test';

import { SET_MARKER } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';

import { getTreeRows, sameRows } from './get-tree-rows';

const state = { a: { x: 1, y: { deep: 1 } }, b: 2, list: [SET_MARKER, 1], c: [] };
const keysOf = (path: Array<string | number>) => {
  const container = path.reduce<any>((value, key) => value[key], state);
  return Object.keys(container).filter((key) => key !== '0' || !Array.isArray(container));
};

it('lists the values of the state, and beneath a container that is open, its values', () => {
  const closed = getTreeRows(state as never, () => false, keysOf);
  expect(closed.map((row) => row.id)).toEqual(['["a"]', '["b"]', '["list"]', '["c"]']);
  expect(closed.every((row) => row.level === 1)).toBe(true);

  const open = new Set([pathKey(['a']), pathKey(['a', 'y'])]);
  const rows = getTreeRows(state as never, (id) => open.has(id), keysOf);
  expect(rows.map((row) => [...row.path])).toEqual([
    ['a'],
    ['a', 'x'],
    ['a', 'y'],
    ['a', 'y', 'deep'],
    ['b'],
    ['list'],
    ['c'],
  ]);
  expect(rows.map((row) => row.level)).toEqual([1, 2, 2, 3, 1, 1, 1]);
});

it('says two lists of rows are the same when they hold the same rows in the same order', () => {
  const a = getTreeRows(state as never, () => false, keysOf);
  const b = getTreeRows(state as never, () => false, keysOf);
  expect(sameRows(a, b)).toBe(true);
  expect(sameRows(a, b.slice(1))).toBe(false);
});
