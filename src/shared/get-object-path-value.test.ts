import { describe, expect, it } from 'vite-plus/test';

import { getObjectPathValue } from './get-object-path-value';

describe('getObjectPathValue', () => {
  it('returns nested value for object path', () => {
    const state = {
      player: {
        stats: {
          health: 42,
        },
      },
    };

    expect(getObjectPathValue(state, ['player', 'stats', 'health'])).toBe(42);
  });

  it('reads map keys using string/number path values', () => {
    const map = new Map<string | number, { ready: boolean }>([['1', { ready: true }]]);

    expect(getObjectPathValue(map, [1, 'ready'])).toBe(true);
  });

  it('returns null when path cannot be resolved', () => {
    const state = { player: 7 };

    expect(getObjectPathValue(state, ['player', 'name'])).toBeNull();
  });
});
