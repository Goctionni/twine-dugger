import { expect, it } from 'vite-plus/test';

import { getTypesInColumns } from './types-in-columns';

it('lists the types in the columns that the path shows, not the ones below the selection', () => {
  const state = { a: { b: { n: 1 } }, s: 'x', list: [true], z: null };
  expect(getTypesInColumns(state, [])).toEqual(['object', 'array', 'string', 'other']);
  expect(getTypesInColumns(state, ['a'])).toEqual(['object', 'array', 'string', 'other']);
  expect(getTypesInColumns(state, ['a', 'b'])).toEqual([
    'object',
    'array',
    'number',
    'string',
    'other',
  ]);
});
