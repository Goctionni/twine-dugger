import { expect, it } from 'vite-plus/test';

import type { ValueType } from '@/shared/shared-types';

import { countHiddenKeys, filterKeysByType } from './filter-keys';
import { sortKeysByChanged, toFilterType } from './sort-keys';

it('files the types that have no type of their own under other', () => {
  expect(
    ['null', 'undefined', 'function', 'date', 'string'].map((t) => toFilterType(t as never)),
  ).toEqual(['other', 'other', 'other', 'other', 'string']);
});

it('hides the keys of the hidden types, but not the selected one', () => {
  const types: Record<string, ValueType> = { a: 'string', b: 'number', c: 'null', d: 'object' };
  const getType = (key: string) => types[key]!;
  const keys = () => Object.keys(types);

  expect(filterKeysByType(keys(), getType, [])).toEqual(['a', 'b', 'c', 'd']);
  expect(filterKeysByType(keys(), getType, ['string', 'other'])).toEqual(['b', 'd']);
  expect(filterKeysByType(keys(), getType, ['string', 'other'], 'c')).toEqual(['b', 'c', 'd']);
});

it('counts what the filter hides in a container', () => {
  const container = { a: 'x', b: 1, c: { d: 1 }, e: null };
  expect(countHiddenKeys(container, [])).toBe(0);
  expect(countHiddenKeys(container, ['string', 'object', 'other'])).toBe(3);
  expect(countHiddenKeys(container, ['string', 'object', 'other'], 'c')).toBe(2);
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
