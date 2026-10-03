import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/devtools-panel/store/game-state', () => ({ getLastChangeId: () => 0 }));

import { createSorter } from './property-sorter';

describe('createSorter', () => {
  it('sorts the keys of objects and maps', () => {
    const object = { a: 1, b: 'x' };
    expect(createSorter(object, 'alphabetic', false, [])(['b', 'a'])).toEqual(['a', 'b']);
    expect(createSorter(object, 'alphabetic', true, [])(['a', 'b'])).toEqual(['b', 'a']);
    expect(createSorter(object, 'type', false, [])(['a', 'b'])).toEqual(['b', 'a']);
  });

  it('keeps the items of arrays and sets in the order they have, whatever the order', () => {
    const array = ['x', 2, true];
    const set = ['__twinedugger-type: Set', 'x', 2];
    for (const order of ['alphabetic', 'type', 'most-recent'] as const) {
      for (const desc of [false, true]) {
        expect(createSorter(array, order, desc, [])([0, 1, 2])).toEqual([0, 1, 2]);
        expect(createSorter(set, order, desc, [])([1, 2])).toEqual([1, 2]);
      }
    }
  });
});
