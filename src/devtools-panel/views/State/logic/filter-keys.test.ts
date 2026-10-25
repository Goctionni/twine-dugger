import { expect, it } from 'vite-plus/test';

import type { ValueType } from '@/shared/shared-types';

import { createQueryMatcher } from '../../GlobalSearch/logic/query-matcher';
import { countHiddenKeys, filterKeysByType } from './filter-keys';
import { sortKeysByChanged, toFilterType } from './sort-keys';

it('files the types that have no type of their own under other', () => {
  expect(
    ['null', 'undefined', 'function', 'date', 'string'].map((t) => toFilterType(t as never)),
  ).toEqual(['other', 'other', 'other', 'other', 'string']);
});

it('hides the keys of the hidden types', () => {
  const types: Record<string, ValueType> = { a: 'string', b: 'number', c: 'null', d: 'object' };
  const getType = (key: string) => types[key]!;
  const keys = () => Object.keys(types);

  expect(filterKeysByType(keys(), getType, [])).toEqual(['a', 'b', 'c', 'd']);
  expect(filterKeysByType(keys(), getType, ['string', 'other'])).toEqual(['b', 'd']);
});

it('counts what the filter hides in a container', () => {
  const container = { a: 'x', b: 1, c: { d: 1 }, e: null };
  expect(countHiddenKeys(container, [])).toBe(0);
  expect(countHiddenKeys(container, ['string', 'object', 'other'])).toBe(3);
  expect(countHiddenKeys('text', ['string'])).toBe(0);
});

it('puts what changed last first, and the rest by name', () => {
  const changes: Record<string, number> = { a: 0, b: 5, c: 9, d: 0 };
  expect(sortKeysByChanged(Object.keys(changes), (key) => changes[key]!)).toEqual([
    'c',
    'b',
    'a',
    'd',
  ]);
});

it('counts what the search hides, after the filter of types', () => {
  const result = createQueryMatcher('go', { caseSensitive: false, wholeWord: false, regex: false });
  if (!result.ok) throw new Error(result.error);

  const container = { gold: 1, goblin: 'x', silver: 2, golem: { a: 1 } };
  expect(countHiddenKeys(container, [], result.queryMatcher)).toBe(1);
  expect(countHiddenKeys(container, ['number'], result.queryMatcher)).toBe(2);
});

it('counts the keys that the filtered paths hide too', () => {
  const container = { a: 'x', b: 1, c: 2 };
  expect(countHiddenKeys(container, [], undefined, (key) => key === 'a')).toBe(1);
  expect(countHiddenKeys(container, ['number'], undefined, (key) => key === 'a')).toBe(3);
});
