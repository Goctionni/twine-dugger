import { expect, it } from 'vite-plus/test';

import { NAN_MARKER, POSITIVE_INFINITY_MARKER, SET_MARKER } from '@/shared/json-safe';

import { getLockingPath } from './edit-status';
import { describeAge, describeLength, describeType, formatAsJson, getPosition } from './info';

it('says what kind of number it is', () => {
  expect(describeType(3, 'number')).toBe('number · integer');
  expect(describeType(3.5, 'number')).toBe('number · decimal');
  expect(describeType(NAN_MARKER, 'NaN')).toBe('number · NaN');
  expect(describeType(POSITIVE_INFINITY_MARKER, 'infinity')).toBe('number · infinite');
  expect(describeType('a', 'string')).toBe('string');
});

it('counts the characters and the lines of a text, and notices numbers', () => {
  expect(describeLength('a')).toBe('1 character · 1 line');
  expect(describeLength('one\ntwo')).toBe('7 characters · 2 lines');
  expect(describeLength('42')).toBe('2 characters · 1 line · looks like a number');
  expect(describeLength('')).toBe('0 characters · 1 line');
});

it('writes a value as JSON, and cuts a long one', () => {
  expect(formatAsJson('a"b')).toBe('"a\\"b"');
  expect(formatAsJson(undefined)).toBe('undefined');
  expect(formatAsJson(NAN_MARKER)).toBe('NaN');
  expect(formatAsJson('x'.repeat(100))).toHaveLength(80);
  expect(formatAsJson('x'.repeat(100)).endsWith('…')).toBe(true);
});

it('says how long ago the value changed, in updates', () => {
  expect(describeAge(10, 0)).toBe('none seen since the panel opened');
  expect(describeAge(10, 10)).toBe('in the latest update');
  expect(describeAge(10, 9)).toBe('1 update ago');
  expect(describeAge(10, 4)).toBe('6 updates ago');
});

it('finds the place of a key among the keys of its parent', () => {
  expect(getPosition({ a: 1, b: 2, c: 3 }, 'b')).toEqual({ index: 2, total: 3 });
  expect(getPosition(['x', 'y'], 1)).toEqual({ index: 2, total: 2 });
  expect(getPosition([SET_MARKER, 'x', 'y'], 2)).toEqual({ index: 2, total: 2 });
  expect(getPosition({ a: 1 }, 'gone')).toEqual({ index: 0, total: 1 });
});

it('finds which path holds the lock: itself, or the nearest parent', () => {
  const locked = [['a'], ['a', 'b'], ['x']];
  expect(getLockingPath(['a', 'b', 'c'], locked)).toEqual(['a', 'b']);
  expect(getLockingPath(['a', 'b'], locked)).toEqual(['a', 'b']);
  expect(getLockingPath(['a', 'z'], locked)).toEqual(['a']);
  expect(getLockingPath(['y'], locked)).toBeUndefined();
});
