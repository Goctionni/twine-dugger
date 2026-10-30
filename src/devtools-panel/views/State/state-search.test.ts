import { expect, it } from 'vite-plus/test';

import { TYPE_KEY } from '@/shared/json-safe';

import { createQueryMatcher } from '../GlobalSearch/logic/query-matcher';
import { matchesSearch } from './state-search';

const matcher = (searchText: string) => {
  const result = createQueryMatcher(searchText, {
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  if (!result.ok) throw new Error(result.error);
  return result.queryMatcher;
};

it('matches the name of a property, ignoring case', () => {
  expect(matchesSearch(matcher('GOLD'), { goldCoins: 3, silver: 1 }, 'goldCoins')).toBe(true);
  expect(matchesSearch(matcher('gold'), { goldCoins: 3, silver: 1 }, 'silver')).toBe(false);
});

it('matches a string, a number and a boolean as the text they are written as', () => {
  const container = { a: 'Hello', b: 1250, c: true, d: null, e: { f: 'hello' } };
  expect(matchesSearch(matcher('ell'), container, 'a')).toBe(true);
  expect(matchesSearch(matcher('25'), container, 'b')).toBe(true);
  expect(matchesSearch(matcher('tru'), container, 'c')).toBe(true);
  expect(matchesSearch(matcher('null'), container, 'd')).toBe(false);
  expect(matchesSearch(matcher('hello'), container, 'e')).toBe(false);
});

it('does not match the index of an item of an array', () => {
  expect(matchesSearch(matcher('1'), ['a', 'b'], 1)).toBe(false);
  expect(matchesSearch(matcher('b'), ['a', 'b'], 1)).toBe(true);
});

it('matches a Date as the time it is shown as, and not the marker that carries it', () => {
  const container = { when: `${TYPE_KEY}: Date 2020-01-02T03:04:05` };
  expect(matchesSearch(matcher('2020-01-02'), container, 'when')).toBe(true);
  expect(matchesSearch(matcher('03:04'), container, 'when')).toBe(true);
  expect(matchesSearch(matcher('02 03'), container, 'when')).toBe(true);
  expect(matchesSearch(matcher('02T03'), container, 'when')).toBe(false);
  expect(matchesSearch(matcher('twinedugger'), container, 'when')).toBe(false);
  expect(matchesSearch(matcher('Date'), container, 'when')).toBe(false);
});
