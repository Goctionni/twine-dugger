import { describe, expect, it } from 'vite-plus/test';

import {
  fromDateMarker,
  getDateText,
  getJsonType,
  getMarkedValueText,
  hasNewMarkedValue,
  isDateMarker,
  isNumberLike,
  jsonEqual,
  toDateMarker,
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

describe('Date markers', () => {
  const marker = `${TYPE_KEY}: Date 2020-01-02T03:04:05`;

  it('writes a Date as one string, in the time of the game page, to the second', () => {
    expect(toDateMarker(new Date(2020, 0, 2, 3, 4, 5, 678))).toBe(marker);
    expect(toDateMarker(new Date(2020, 11, 31, 23, 59, 59))).toBe(
      `${TYPE_KEY}: Date 2020-12-31T23:59:59`,
    );
  });

  it('writes a Date that is not a time as invalid', () => {
    expect(toDateMarker(new Date(Number.NaN))).toBe(`${TYPE_KEY}: Date Invalid`);
  });

  it('knows a Date marker from a string and from other markers', () => {
    expect(isDateMarker(marker)).toBe(true);
    expect(isDateMarker(`${TYPE_KEY}: Date Invalid`)).toBe(true);
    expect(isDateMarker('2020-01-02T03:04:05')).toBe(false);
    expect(isDateMarker(NAN_MARKER)).toBe(false);
    expect(isDateMarker(SET_MARKER)).toBe(false);
    expect(isDateMarker({ [TYPE_KEY]: 'Date' })).toBe(false);
    expect(isDateMarker(5)).toBe(false);
  });

  it('is a date for getJsonType, and nothing else changes for strings', () => {
    expect(getJsonType(marker)).toBe('date');
    expect(getJsonType(`${TYPE_KEY}: Date Invalid`)).toBe('date');
    expect(getJsonType('Date 2020')).toBe('string');
  });

  it('gives the Date back, also for a year before 100', () => {
    expect(fromDateMarker(marker as never)).toEqual(new Date(2020, 0, 2, 3, 4, 5));
    const early = new Date(2000, 5, 6, 7, 8, 9);
    early.setFullYear(99);
    expect(fromDateMarker(toDateMarker(early))).toEqual(early);
    expect(Number.isNaN(fromDateMarker(`${TYPE_KEY}: Date Invalid` as never).getTime())).toBe(true);
  });

  it('writes a Date marker as year-month-day and the time', () => {
    expect(getDateText(marker as never)).toBe('2020-01-02 03:04:05');
    expect(getDateText(`${TYPE_KEY}: Date Invalid` as never)).toBe('Invalid Date');
  });
});
