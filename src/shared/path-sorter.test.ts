import { describe, expect, it } from 'vite-plus/test';

import { sortPaths } from './path-sorter';

describe('path-sorter', () => {
  it('should sort paths alphabetically and by depth', () => {
    const input: string[][] = [
      ['state', 'z', 'score'],
      ['state', 'a', 'name'],
      ['state', 'a', 'inventory'],
      ['state', 'b'],
    ];

    const expected: string[][] = [
      ['state', 'a', 'inventory'],
      ['state', 'a', 'name'],
      ['state', 'b'],
      ['state', 'z', 'score'],
    ];

    expect(sortPaths(input)).toEqual(expected);
  });

  it('should sort numeric values correctly', () => {
    const input: (string | number)[][] = [[10, 'a'], [1, 'b'], [5]];

    const expected: (string | number)[][] = [[1, 'b'], [5], [10, 'a']];

    expect(sortPaths(input)).toEqual(expected);
  });

  it('should handle paths of different lengths correctly (prefix)', () => {
    const input: string[][] = [
      ['state', 'a', 'b'],
      ['state', 'a'],
    ];

    const expected: string[][] = [
      ['state', 'a'],
      ['state', 'a', 'b'],
    ];

    expect(sortPaths(input)).toEqual(expected);
  });
});
