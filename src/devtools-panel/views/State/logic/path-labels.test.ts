import { expect, it } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';

import { getPathLabels } from './path-labels';

it('names the items of a set by position, not by where they are after the marker', () => {
  const state = {
    tags: [SET_MARKER, 'x', 'y'],
    scores: { [TYPE_KEY]: 'Map', ann: [1, 2] },
  };
  expect(getPathLabels(state, ['tags', 2])).toEqual(['tags', '1']);
  expect(getPathLabels(state, ['scores', 'ann', 1])).toEqual(['scores', 'ann', '1']);
});

it('has no names for what is not in the state, nor for what comes after it', () => {
  const state = { a: { b: 1, gone: undefined }, s: 'text' };
  expect(getPathLabels(state, ['a', 'b'])).toEqual(['a', 'b']);
  expect(getPathLabels(state, ['a', 'gone'])).toEqual(['a', 'gone']);
  expect(getPathLabels(state, ['a', 'missing', 'x'])).toEqual(['a']);
  expect(getPathLabels(state, ['a', 'b', 'deeper'])).toEqual(['a', 'b']);
  expect(getPathLabels(state, ['s', 0])).toEqual(['s']);
  expect(getPathLabels(state, ['missing'])).toEqual([]);
});
