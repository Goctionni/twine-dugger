import { describe, expect, it } from 'vite-plus/test';

import { resolveMapKey } from './map-keys';

describe('resolveMapKey', () => {
  it('finds the key that is in the map, whatever kind it is', () => {
    expect(resolveMapKey(new Map([[1, 'a']]), '1')).toBe(1);
    expect(resolveMapKey(new Map([['1', 'a']]), '1')).toBe('1');
    expect(
      resolveMapKey(
        new Map<unknown, unknown>([
          [1, 'a'],
          ['name', 'b'],
        ]),
        'name',
      ),
    ).toBe('name');
  });

  it('gives a new key that looks like a number to a map that has number keys, or no keys', () => {
    expect(resolveMapKey(new Map([[1, 'a']]), '2')).toBe(2);
    expect(resolveMapKey(new Map(), '2')).toBe(2);
    expect(resolveMapKey(new Map([['a', 1]]), '2')).toBe('2');
    expect(resolveMapKey(new Map([[1, 'a']]), 'name')).toBe('name');
    expect(resolveMapKey(new Map(), 2)).toBe(2);
    expect(resolveMapKey(new Map([['a', 1]]), 2)).toBe('2');
  });
});
