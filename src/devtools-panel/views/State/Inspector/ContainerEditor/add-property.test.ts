import { expect, it } from 'vite-plus/test';

import {
  MARKED_VALUE_WRITE_ERROR,
  NAN_MARKER,
  POSITIVE_INFINITY_MARKER,
  SET_MARKER,
  TYPE_KEY,
  UNDEFINED_MARKER,
} from '@/shared/json-safe';

import {
  checkName,
  getAddition,
  getDefaultType,
  getEmptyValue,
  parseJsonValue,
  toJsonText,
} from './add-property';

it('starts every type from a value of its own, containers empty and marked', () => {
  expect(getEmptyValue('string')).toBe('');
  expect(getEmptyValue('number')).toBe(0);
  expect(getEmptyValue('boolean')).toBe(false);
  expect(getEmptyValue('object')).toEqual({});
  expect(getEmptyValue('array')).toEqual([]);
  expect(getEmptyValue('map')).toEqual({ [TYPE_KEY]: 'Map' });
  expect(getEmptyValue('set')).toEqual([SET_MARKER]);
});

it('shows a value as JSON text, with the marker of a Map and of a Set', () => {
  expect(toJsonText('a"b')).toBe('"a\\"b"');
  expect(JSON.parse(toJsonText(getEmptyValue('map')))).toEqual({ [TYPE_KEY]: 'Map' });
  expect(JSON.parse(toJsonText(getEmptyValue('set')))).toEqual([SET_MARKER]);
});

it('takes JSON that is a value of the chosen type', () => {
  expect(parseJsonValue('string', '"hi"')).toEqual({ value: 'hi' });
  expect(parseJsonValue('number', '4.5')).toEqual({ value: 4.5 });
  expect(parseJsonValue('boolean', 'true')).toEqual({ value: true });
  expect(parseJsonValue('object', '{"a": [1, 2]}')).toEqual({ value: { a: [1, 2] } });
  expect(parseJsonValue('array', '[1, "x"]')).toEqual({ value: [1, 'x'] });
  const map = { [TYPE_KEY]: 'Map', a: 1 };
  expect(parseJsonValue('map', JSON.stringify(map))).toEqual({ value: map });
  const set = [SET_MARKER, 1, 2];
  expect(parseJsonValue('set', JSON.stringify(set))).toEqual({ value: set });
});

it('says what is wrong with JSON that does not fit', () => {
  expect(parseJsonValue('number', '{')).toEqual({ error: 'This is not valid JSON' });
  expect(parseJsonValue('number', '"4"')).toEqual({ error: 'Expected a number' });
  expect(parseJsonValue('string', '4')).toEqual({ error: 'Expected a string' });
  expect(parseJsonValue('object', '[1]')).toEqual({ error: 'Expected an object' });
  expect(parseJsonValue('object', JSON.stringify({ [TYPE_KEY]: 'Map' }))).toHaveProperty('error');
  expect(parseJsonValue('map', '{}')).toHaveProperty('error');
  expect(parseJsonValue('array', JSON.stringify([SET_MARKER]))).toHaveProperty('error');
  expect(parseJsonValue('set', '[1]')).toHaveProperty('error');
});

it('starts from a type only when all the children are of it', () => {
  expect(getDefaultType(['number', 'number'])).toBe('number');
  expect(getDefaultType(['map'])).toBe('map');
  expect(getDefaultType(['number', 'string'])).toBeUndefined();
  expect(getDefaultType([])).toBeUndefined();
  expect(getDefaultType(['null', 'null'])).toBeUndefined();
});

it('checks the name of a new property', () => {
  expect(checkName('', ['a'])).toBe('A name is needed');
  expect(checkName('  ', ['a'])).toBe('A name is needed');
  expect(checkName(TYPE_KEY, [])).toBe('That name is reserved');
  expect(checkName('a', ['a', 'b'])).toBe('a already exists');
  expect(checkName('5', [5])).toBe('5 already exists');
  expect(checkName('c', ['a', 'b'])).toBeUndefined();
});

it('puts a new item of an array at the end, and a property at its name', () => {
  expect(getAddition(['list'], 'array', 3, { value: 1 })).toEqual({ path: ['list', 3], value: 1 });
  expect(getAddition(['a', 'b'], 'object', 2, { name: 'x', value: 'y' })).toEqual({
    path: ['a', 'b', 'x'],
    value: 'y',
  });
  expect(getAddition([], 'map', 0, { name: 'k', value: 1 }).path).toEqual(['k']);
});

it('does not take NaN, an infinity or undefined from the text', () => {
  const error = { error: MARKED_VALUE_WRITE_ERROR };
  expect(parseJsonValue('string', `"${NAN_MARKER}"`)).toEqual(error);
  expect(parseJsonValue('object', `{"a": {"b": "${UNDEFINED_MARKER}"}}`)).toEqual(error);
  expect(parseJsonValue('array', `["${POSITIVE_INFINITY_MARKER}"]`)).toEqual(error);
  expect(parseJsonValue('string', '"NaN"')).toEqual({ value: 'NaN' });
});
