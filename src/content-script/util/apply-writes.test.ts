import { expect, it } from 'vite-plus/test';

import { NAN_MARKER, SET_MARKER, TYPE_KEY } from '@/shared/json-safe';

import { deleteFromState, setState } from '../format-helpers/shared';
import { applyWrites } from './apply-writes';

const targetOf = (state: Record<string, any>) => ({
  setState: (path: Array<string | number>, value: unknown) => setState(state, path, value),
  deleteFromState: (path: Array<string | number>) => deleteFromState(state, path),
});

it('applies the writes in order and reports each one', () => {
  const state: Record<string, any> = { a: 1, list: [1, 2, 3] };
  const results = applyWrites(
    [
      { path: ['a'], value: 2 },
      { path: ['b'], value: 'new' },
      { path: ['list', 2], delete: true },
      { path: ['list', 1], delete: true },
    ],
    targetOf(state),
  );

  expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
  expect(state).toEqual({ a: 2, b: 'new', list: [1] });
});

it('carries on after a write that fails, and says what went wrong', () => {
  const state: Record<string, any> = { a: 1 };
  const results = applyWrites(
    [
      { path: ['gone', 'x'], value: 1 },
      { path: ['a'], value: 5 },
    ],
    targetOf(state),
  );

  expect(results[0]!.ok).toBe(false);
  expect(results[1]).toEqual({ ok: true });
  expect(state.a).toBe(5);
});

it('restores a Map, Set or Date at the top of a value, and inside only with deep', () => {
  const state: Record<string, any> = {};
  const nested = { m: { [TYPE_KEY]: 'Map', k: 1 }, n: NAN_MARKER };

  applyWrites(
    [
      { path: ['top'], value: { [TYPE_KEY]: 'Map', k: 1 } },
      { path: ['set'], value: [SET_MARKER, 1] },
      { path: ['plain'], value: nested },
      { path: ['deep'], value: nested, deep: true },
    ],
    targetOf(state),
  );

  expect(state.top).toEqual(new Map([['k', 1]]));
  expect(state.set).toEqual(new Set([1]));
  expect(state.plain).toEqual(nested);
  expect(state.deep.m).toEqual(new Map([['k', 1]]));
  expect(state.deep.n).toBeNaN();
});

it('reports a function that cannot be restored, without stopping', () => {
  const state: Record<string, any> = {};
  const results = applyWrites(
    [
      { path: ['f'], value: { [TYPE_KEY]: 'Map', fn: { [TYPE_KEY]: 'function', str: 'x' } } },
      { path: ['ok'], value: 1 },
    ],
    targetOf(state),
  );

  expect(results[0]).toEqual({ ok: false, error: 'A function can not be restored' });
  expect(results[1]).toEqual({ ok: true });
  expect(state).toEqual({ ok: 1 });
});
