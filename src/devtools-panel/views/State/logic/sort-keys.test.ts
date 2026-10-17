import { expect, it } from 'vite-plus/test';

import type { ValueType } from '@/shared/shared-types';

import { sortKeysByType } from './sort-keys';

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
