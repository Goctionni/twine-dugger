import { describe, expect, it } from 'vite-plus/test';

import { posttransformValue } from '@/content-script/util/post-transform';

import { isNumberLike, jsonEqual, toWireValue } from './json-safe';
import type { JSONSafeValue } from './shared-types';

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

describe('toWireValue panel-to-game handshake', () => {
  const roundTrip = (value: unknown) =>
    posttransformValue(JSON.parse(JSON.stringify(toWireValue(value))) as JSONSafeValue) as unknown;

  it('keeps an empty Map a Map', () => {
    expect(roundTrip(new Map())).toBeInstanceOf(Map);
  });

  it('keeps an empty Set a Set', () => {
    expect(roundTrip(new Set())).toBeInstanceOf(Set);
  });

  it('keeps Map entries intact', () => {
    expect(roundTrip(new Map([['a', 1]]))).toEqual(new Map([['a', 1]]));
  });

  it('keeps Set entries intact', () => {
    expect(roundTrip(new Set(['x']))).toEqual(new Set(['x']));
  });

  it('preserves numeric Map keys across the wire', () => {
    expect(roundTrip(new Map<number, string>([[1, 'a']]))).toEqual(new Map([[1, 'a']]));
    const mixed: Array<[string | number, string | number]> = [
      [1, 'a'],
      ['b', 2],
    ];
    expect(roundTrip(new Map(mixed))).toEqual(new Map(mixed));
  });

  it('round-trips nested containers', () => {
    expect(roundTrip({ m: new Map([['s', new Set([1])]]) })).toEqual({
      m: new Map([['s', new Set([1])]]),
    });
  });

  it('leaves primitives, objects and arrays untouched', () => {
    expect(toWireValue('hi')).toBe('hi');
    expect(toWireValue(42)).toBe(42);
    expect(toWireValue(false)).toBe(false);
    expect(toWireValue({ a: 1 })).toEqual({ a: 1 });
    expect(toWireValue(['x'])).toEqual(['x']);
    expect(posttransformValue(toWireValue({}) as JSONSafeValue)).toEqual({});
  });
});
