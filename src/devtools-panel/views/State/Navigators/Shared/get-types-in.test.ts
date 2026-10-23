import { expect, it } from 'vite-plus/test';

import { NAN_MARKER, SET_MARKER } from '@/shared/json-safe';

import { getTypesIn } from './get-types-in';

it('lists the types of the values in a container, in the order of the types', () => {
  expect(getTypesIn({ s: 'x', n: 1, o: {}, list: [], flag: true })).toEqual([
    'object',
    'array',
    'boolean',
    'number',
    'string',
  ]);
  // NaN is a number, and null and the like are 'other'
  expect(getTypesIn({ a: NAN_MARKER, b: null })).toEqual(['number', 'other']);
  expect(getTypesIn([SET_MARKER, 'a'])).toEqual(['string']);
});

it('has nothing for a value that is not a container', () => {
  expect(getTypesIn(5)).toEqual([]);
  expect(getTypesIn('text')).toEqual([]);
  expect(getTypesIn({})).toEqual([]);
});
