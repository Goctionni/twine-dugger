import { describe, expect, it } from 'vite-plus/test';

import { createSorter } from './property-sorter';

describe('createSorter', () => {
  it('should sort keys alphabetically and keep numeric keys in ascending order', () => {
    const sorter = createSorter({}, 'alphabetic');

    expect(sorter([3, 1, 'b', 'a'])).toStrictEqual([1, 3, 'a', 'b']);
  });

  it('should sort keys by value type priority and key fallback', () => {
    const object = {
      alpha: { x: 1 },
      beta: new Map([['k', 1]]),
      gamma: [1, 2],
      delta: new Set([1]),
      epsilon: () => 1,
      zeta: 'text',
      eta: 3,
      theta: false,
      iota: null,
      kappa: undefined,
    };

    const sorter = createSorter(object, 'type');
    const sorted = sorter([
      'eta',
      'zeta',
      'kappa',
      'alpha',
      'delta',
      'gamma',
      'beta',
      'theta',
      'iota',
      'epsilon',
    ]);

    expect(sorted).toStrictEqual([
      'alpha',
      'beta',
      'gamma',
      'delta',
      'epsilon',
      'zeta',
      'eta',
      'theta',
      'iota',
      'kappa',
    ]);
  });

  it('should prioritize numeric keys before string keys in type order', () => {
    const object = {
      2: 'two',
      5: 'five',
      alpha: 'a',
    };

    const sorter = createSorter(object, 'type');
    expect(sorter(['alpha', 5, 2])).toStrictEqual([2, 5, 'alpha']);
  });

  it('should fallback to lexical key order when value types are equal', () => {
    const object = {
      bKey: 'first',
      aKey: 'second',
    };

    const sorter = createSorter(object, 'type');
    expect(sorter(['bKey', 'aKey'])).toStrictEqual(['aKey', 'bKey']);
  });

  it('should return keys unchanged for none order', () => {
    const keys: Array<string | number> = ['b', 'a', 2, 1];
    const sorter = createSorter({}, 'none');

    expect(sorter(keys)).toBe(keys);
  });
});
