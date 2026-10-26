import { describe, expect, it } from 'vite-plus/test';

import {
  getDateText,
  getJsonType,
  getMarkedValueText,
  hasNewMarkedValue,
  isNumberLike,
  jsonEqual,
  NAN_MARKER,
  NEGATIVE_INFINITY_MARKER,
  POSITIVE_INFINITY_MARKER,
  SET_MARKER,
  trimToExistingPath,
  TYPE_KEY,
  UNDEFINED_MARKER,
} from './json-safe';

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

describe('markers for NaN, the infinities and undefined', () => {
  it('are told apart as values of their own type, and a plain string is a string', () => {
    expect(getJsonType(NAN_MARKER)).toBe('NaN');
    expect(getJsonType(POSITIVE_INFINITY_MARKER)).toBe('infinity');
    expect(getJsonType(NEGATIVE_INFINITY_MARKER)).toBe('infinity');
    expect(getJsonType(UNDEFINED_MARKER)).toBe('undefined');
    expect(getJsonType('NaN')).toBe('string');
    expect(getJsonType(Number.NaN)).toBe('number');
  });

  it('say what they stand for as text', () => {
    expect(getMarkedValueText(NAN_MARKER)).toBe('NaN');
    expect(getMarkedValueText(POSITIVE_INFINITY_MARKER)).toBe('Infinity');
    expect(getMarkedValueText(NEGATIVE_INFINITY_MARKER)).toBe('-Infinity');
    expect(getMarkedValueText(UNDEFINED_MARKER)).toBe('undefined');
    expect(getMarkedValueText('undefined')).toBeUndefined();
  });
});

describe('hasNewMarkedValue', () => {
  it('finds a marker that was not there before, at any depth', () => {
    expect(hasNewMarkedValue(1, NAN_MARKER)).toBe(true);
    expect(hasNewMarkedValue(undefined, { a: [1, UNDEFINED_MARKER] })).toBe(true);
    expect(hasNewMarkedValue({ a: 1 }, { a: POSITIVE_INFINITY_MARKER })).toBe(true);
    // Another marker in the same place is new too
    expect(hasNewMarkedValue(NAN_MARKER, POSITIVE_INFINITY_MARKER)).toBe(true);
  });

  it('does not find one that stays where it was, or a plain value', () => {
    expect(hasNewMarkedValue(NAN_MARKER, NAN_MARKER)).toBe(false);
    expect(hasNewMarkedValue({ a: NAN_MARKER, b: 1 }, { a: NAN_MARKER, b: 2 })).toBe(false);
    expect(hasNewMarkedValue([NAN_MARKER], [NAN_MARKER, 3])).toBe(false);
    expect(hasNewMarkedValue(undefined, { a: 'NaN', b: null })).toBe(false);
  });
});

describe('getDateText', () => {
  it('writes a Date as year-month-day and the time, with two digits where it needs them', () => {
    const date = { [TYPE_KEY]: 'Date', Y: 2020, M: 1, D: 2, h: 3, m: 4, s: 5 } as const;
    expect(getDateText(date)).toBe('2020-01-02 03:04:05');
    expect(getDateText({ ...date, M: 12, D: 31, h: 23, m: 59, s: 59 })).toBe('2020-12-31 23:59:59');
    expect(getDateText({ ...date, Y: 99 })).toBe('0099-01-02 03:04:05');
  });

  it('says a Date that is not a time is invalid', () => {
    const invalid = { [TYPE_KEY]: 'Date', Y: null, M: null, D: null, h: null, m: null, s: null };
    expect(getDateText(invalid as never)).toBe('Invalid Date');
  });
});
