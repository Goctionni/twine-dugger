import { expect, it } from 'vite-plus/test';

import { getVisibleKeys } from './visible-keys';

const none = () => false;
const noChange = () => 0;

it('puts the pinned keys first, in every sort', () => {
  const container = { b: 1, a: 'x', c: { d: 1 }, e: 2 };
  const isPinned = (key: string | number) => key === 'e' || key === 'a';

  expect(getVisibleKeys(container, 'name', [], noChange, isPinned)).toEqual(['a', 'e', 'b', 'c']);
  expect(getVisibleKeys(container, 'type', [], noChange, isPinned)).toEqual(['e', 'a', 'c', 'b']);
  expect(getVisibleKeys(container, 'type', [], noChange, none)).toEqual(['c', 'b', 'e', 'a']);
});

it('leaves the items of an array in their order', () => {
  expect(getVisibleKeys(['x', 'y', 'z'], 'name', [], noChange, (key) => key === 2)).toEqual([
    0, 1, 2,
  ]);
});
