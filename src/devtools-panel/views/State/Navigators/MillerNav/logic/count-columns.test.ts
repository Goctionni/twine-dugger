import { expect, it } from 'vite-plus/test';

import { createQueryMatcher } from '../../../../GlobalSearch/logic/query-matcher';
import { countColumns } from './count-columns';

const state = { a: { x: 1, y: 2 }, b: 'text', empty: {}, deep: { list: [true] } };

it('has a column for the root and for every container on the path', () => {
  expect(countColumns(state, [], [])).toBe(1);
  expect(countColumns(state, ['a'], [])).toBe(2);
  expect(countColumns(state, ['deep', 'list'], [])).toBe(3);
});

it('has no column for a value, an empty container, or what is not there', () => {
  expect(countColumns(state, ['b'], [])).toBe(1);
  expect(countColumns(state, ['empty'], [])).toBe(1);
  expect(countColumns(state, ['gone', 'x'], [])).toBe(1);
});

it('has no column for a container whose values are all hidden', () => {
  expect(countColumns(state, ['a'], ['number'])).toBe(1);
  expect(countColumns(state, ['a'], ['string'])).toBe(2);
  expect(countColumns(state, [], ['object', 'string'])).toBe(0);
});

it('drops the column of a selected value too when all its types are hidden', () => {
  expect(countColumns(state, ['a', 'x'], ['number'])).toBe(1);
});

it('has no column for a container where the search matches none of the values', () => {
  const result = createQueryMatcher('b', { caseSensitive: false, wholeWord: false, regex: false });
  if (!result.ok) throw new Error(result.error);

  expect(countColumns(state, ['a'], [], result.queryMatcher)).toBe(1);
});

it('has no column at all when the search matches nothing in the state', () => {
  const result = createQueryMatcher('zz', { caseSensitive: false, wholeWord: false, regex: false });
  if (!result.ok) throw new Error(result.error);

  expect(countColumns(state, [], [], result.queryMatcher)).toBe(0);
});
