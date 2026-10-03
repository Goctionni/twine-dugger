import { describe, expect, it } from 'vite-plus/test';

import { isNumberLike, jsonEqual } from './json-safe';

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
