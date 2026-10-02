import { describe, expect, it } from 'vite-plus/test';

import { createLockEnforcer } from './locks';
import { posttransformValue } from './post-transform';
import { pretransformValue } from './pre-transform';

const lockOf = (path: Array<string | number>, value: unknown) => ({
  path,
  value: pretransformValue(value as never, new Map(), new Map()) as never,
});

function setup(state: Record<string, any>) {
  const setState = (path: Array<string | number>, value: unknown) => {
    const parent = path.slice(0, -1).reduce((obj, key) => obj[key], state as any);
    const key = path.at(-1)!;
    if (parent instanceof Map) parent.set(`${key}`, value);
    else parent[key] = value;
  };
  return { state, enforce: createLockEnforcer(() => state, setState) };
}

describe('createLockEnforcer', () => {
  it('restores a changed value and reports what the game tried', () => {
    const { state, enforce } = setup({ hp: 10, player: { gold: 5 } });
    const locks = [lockOf(['hp'], 10), lockOf(['player', 'gold'], 5)];

    expect(enforce(locks)).toEqual([]);

    state.hp = 3;
    state.player.gold = 6;
    expect(enforce(locks)).toEqual([
      { path: ['hp'], attempted: 3 },
      { path: ['player', 'gold'], attempted: 6 },
    ]);
    expect(state).toEqual({ hp: 10, player: { gold: 5 } });
  });

  it('ignores a lock while its path does not exist, and enforces it once it does', () => {
    const { state, enforce } = setup({ items: [1, 2] });
    const locks = [lockOf(['items', 2], 99), lockOf(['gone', 'deeper'], 1)];

    expect(enforce(locks)).toEqual([]);
    expect(state).toEqual({ items: [1, 2] });

    state.items.push(3);
    expect(enforce(locks)).toEqual([{ path: ['items', 2], attempted: 3 }]);
    expect(state.items).toEqual([1, 2, 99]);
  });

  it('locks a path, not the object that was there: a reorder gets undone', () => {
    const { state, enforce } = setup({ list: [{ id: 1 }, { id: 2 }] });

    state.list.reverse();
    enforce([lockOf(['list', 0], { id: 1 })]);
    expect(state.list).toEqual([{ id: 1 }, { id: 1 }]);
  });

  it('restores Maps, Sets and Dates as what they were', () => {
    const original = {
      map: new Map<string, unknown>([['a', 1]]),
      set: new Set([1, 2]),
      when: new Date(2024, 4, 3, 12, 30, 15),
    };
    const { state, enforce } = setup(structuredClone(original));
    const locks = [
      lockOf(['map'], original.map),
      lockOf(['set'], original.set),
      lockOf(['when'], original.when),
    ];

    state.map.set('b', 2);
    state.set.add(3);
    state.when = new Date(2000, 0, 1);

    expect(enforce(locks).map((revert) => revert.path[0])).toEqual(['map', 'set', 'when']);
    expect(state.map).toEqual(original.map);
    expect(state.set).toEqual(original.set);
    expect(state.when).toEqual(original.when);
  });

  describe('a game that keeps trying to write to a lock', () => {
    it('is only reported the first time it tries the same value', () => {
      const { state, enforce } = setup({ hp: 10 });
      const locks = [lockOf(['hp'], 10)];

      state.hp = 3;
      expect(enforce(locks)).toEqual([{ path: ['hp'], attempted: 3 }]);
      state.hp = 3;
      expect(enforce(locks)).toEqual([]);
      expect(state.hp).toBe(10);

      state.hp = 4;
      expect(enforce(locks)).toEqual([{ path: ['hp'], attempted: 4 }]);
    });

    it('is reported again after it stopped, and after the locks were set again', () => {
      const { state, enforce } = setup({ hp: 10 });
      const locks = [lockOf(['hp'], 10)];

      state.hp = 3;
      enforce(locks);
      enforce(locks);
      state.hp = 3;
      expect(enforce(locks)).toEqual([{ path: ['hp'], attempted: 3 }]);

      state.hp = 3;
      expect(enforce([lockOf(['hp'], 10)])).toEqual([{ path: ['hp'], attempted: 3 }]);
    });
  });
});

describe('posttransformValue', () => {
  it('refuses functions', () => {
    const fn = pretransformValue((() => 1) as never, new Map(), new Map());
    expect(() => posttransformValue(fn)).toThrow(/function/);
  });
});
