import { expect, it } from 'vite-plus/test';

import { createQueryMatcher } from '../../../GlobalSearch/logic/query-matcher';
import { getVisibleKeys } from './visible-keys';

const byName = { by: 'name', isDescending: false } as const;
const byType = { by: 'type', isDescending: false } as const;
const none = () => false;
const noChange = () => 0;

it('puts the pinned keys first, in every sort', () => {
  const container = { b: 1, a: 'x', c: { d: 1 }, e: 2 };
  const isPinned = (key: string | number) => key === 'e' || key === 'a';

  expect(getVisibleKeys(container, byName, [], noChange, isPinned)).toEqual(['a', 'e', 'b', 'c']);
  expect(getVisibleKeys(container, byType, [], noChange, isPinned)).toEqual(['e', 'a', 'c', 'b']);
  expect(getVisibleKeys(container, byType, [], noChange, none)).toEqual(['c', 'b', 'e', 'a']);
});

it('leaves the items of an array in their order', () => {
  expect(getVisibleKeys(['x', 'y', 'z'], byName, [], noChange, (key) => key === 2)).toEqual([
    0, 1, 2,
  ]);
});

it('keeps the keys that match the search, after the filter of types', () => {
  const container = { gold: 1, goldfish: 'x', silver: 2, nested: { gold: 1 } };
  const result = createQueryMatcher('gold', {
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  if (!result.ok) throw new Error(result.error);

  const matcher = result.queryMatcher;
  expect(getVisibleKeys(container, byName, [], noChange, none, matcher)).toEqual([
    'gold',
    'goldfish',
  ]);
  expect(getVisibleKeys(container, byName, ['string'], noChange, none, matcher)).toEqual(['gold']);
});

it('turns the order of the sort around, with the pinned keys still first', () => {
  const container = { b: 1, a: 'x', c: { d: 1 }, e: 2 };
  const isPinned = (key: string | number) => key === 'a';

  expect(getVisibleKeys(container, { by: 'name', isDescending: true }, [], noChange, none)).toEqual(
    ['e', 'c', 'b', 'a'],
  );
  expect(
    getVisibleKeys(container, { by: 'name', isDescending: true }, [], noChange, isPinned),
  ).toEqual(['a', 'e', 'c', 'b']);
  expect(getVisibleKeys(container, { by: 'type', isDescending: true }, [], noChange, none)).toEqual(
    ['a', 'e', 'b', 'c'],
  );
});

it('does not turn the order of an array around', () => {
  expect(
    getVisibleKeys(['x', 'y', 'z'], { by: 'name', isDescending: true }, [], noChange, none),
  ).toEqual([0, 1, 2]);
});
