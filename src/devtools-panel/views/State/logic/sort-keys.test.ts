import { describe, expect, it } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { ValueType } from '@/shared/shared-types';

import { getKeysByName, sortKeysByType } from './sort-keys';

it('puts containers first, then booleans, numbers and strings, and names in natural order', () => {
  const types: Record<string, ValueType> = {
    s: 'string',
    n10: 'number',
    n9: 'number',
    b: 'boolean',
    a: 'array',
    m: 'map',
    o: 'object',
    x: 'null',
  };
  const keys = Object.keys(types);
  expect(sortKeysByType(keys, (key) => types[key]!)).toEqual([
    'o',
    'm',
    'a',
    'b',
    'n9',
    'n10',
    's',
    'x',
  ]);
});

describe('getKeysByName', () => {
  it('orders names naturally and the keys of a number map by number', () => {
    expect(getKeysByName({ b: 1, a: 1, room10: 1, room9: 1 })).toEqual([
      'a',
      'b',
      'room9',
      'room10',
    ]);
    expect(getKeysByName({ [TYPE_KEY]: 'NumberMap', '10': 1, '-2': 1, '9': 1 })).toEqual([
      '-2',
      '9',
      '10',
    ]);
  });

  it('keeps the position order of arrays and sets, and has no keys for what is not a container', () => {
    expect(getKeysByName(['b', 'a'])).toEqual([0, 1]);
    expect(getKeysByName([SET_MARKER, 'b', 'a'])).toEqual([1, 2]);
    expect(getKeysByName('text')).toEqual([]);
  });
});
