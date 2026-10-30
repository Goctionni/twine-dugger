import { expect, it } from 'vite-plus/test';

import { NAN_MARKER, SET_MARKER, TYPE_KEY } from '@/shared/json-safe';

import { createQueryMatcher } from '../../../../GlobalSearch/logic/query-matcher';
import { hasContainerChild } from './has-container-child';

it('is true when a container holds a container', () => {
  expect(hasContainerChild({ a: 1, b: { c: 1 } }, [])).toBe(true);
  expect(hasContainerChild([1, []], [])).toBe(true);
  expect(hasContainerChild({ m: { [TYPE_KEY]: 'Map' } }, [])).toBe(true);
  expect(hasContainerChild([SET_MARKER, [1]], [])).toBe(true);
});

it('is false for values only, empty containers and what is not a container', () => {
  expect(hasContainerChild({ a: 1, b: 'x', n: NAN_MARKER, c: null }, [])).toBe(false);
  expect(hasContainerChild({}, [])).toBe(false);
  expect(hasContainerChild(5, [])).toBe(false);
});

it('does not count a container that the filter of types hides', () => {
  expect(hasContainerChild({ list: [1] }, ['array'])).toBe(false);
  expect(hasContainerChild({ list: [1], o: {} }, ['array'])).toBe(true);
});

it('does not count a container that the search does not match', () => {
  const result = createQueryMatcher('inv', {
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  if (!result.ok) throw new Error(result.error);

  const container = { inventory: { a: 1 }, stats: { b: 2 }, name: 'inv' };
  expect(hasContainerChild(container, [], result.queryMatcher)).toBe(true);
  expect(hasContainerChild({ stats: { b: 2 } }, [], result.queryMatcher)).toBe(false);
});

it('does not count a container on a filtered path', () => {
  const container = { inventory: { a: 1 }, stats: { b: 2 } };
  expect(hasContainerChild(container, [], undefined, (key) => key === 'inventory')).toBe(true);
  expect(hasContainerChild({ inventory: { a: 1 } }, [], undefined, () => true)).toBe(false);
});
