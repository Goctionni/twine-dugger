import { describe, expect, it } from 'vite-plus/test';

import { isNumberLike, jsonEqual, SET_MARKER, trimToExistingPath, TYPE_KEY } from './json-safe';

describe('trimToExistingPath', () => {
  const state = {
    a: { b: 1, gone: undefined },
    list: [1, 2],
    tags: [SET_MARKER, 'x'],
    scores: { [TYPE_KEY]: 'Map', ann: 1 },
    fn: { [TYPE_KEY]: 'function', str: 'x' },
  };

  it('keeps a path that is there, also when its value is undefined', () => {
    expect(trimToExistingPath(state, ['a', 'gone'])).toEqual(['a', 'gone']);
    expect(trimToExistingPath(state, [])).toEqual([]);
  });

  it('stops before the first key that is missing, or that is below a value without keys', () => {
    expect(trimToExistingPath(state, ['a', 'c', 'd'])).toEqual(['a']);
    expect(trimToExistingPath(state, ['list', 2])).toEqual(['list']);
    expect(trimToExistingPath(state, ['tags', 1, 0])).toEqual(['tags', 1]);
    expect(trimToExistingPath(state, ['scores', 'bob'])).toEqual(['scores']);
    expect(trimToExistingPath(state, ['a', 'b', 'x'])).toEqual(['a', 'b']);
    expect(trimToExistingPath(state, ['fn', 'str'])).toEqual(['fn']);
  });
});

describe('isNumberLike', () => {
  it('only accepts text that is exactly what a number is written as', () => {
    expect(['1', '-2', '0.5'].every(isNumberLike)).toBe(true);
    expect(['', '01', ' 1', 'NaN', 'a', 'Infinity'].some(isNumberLike)).toBe(false);
  });
});

describe('jsonEqual', () => {
  it('equates NaN with NaN, and still tells values and structures apart', () => {
    expect(jsonEqual(NaN, NaN)).toBe(true);
    expect(jsonEqual({ a: [NaN, 1] }, { a: [NaN, 1] })).toBe(true);
    expect(jsonEqual({ a: NaN }, { a: 0 })).toBe(false);
    expect(jsonEqual([1], { 0: 1 })).toBe(false);
  });
});
