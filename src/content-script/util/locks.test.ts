import { describe, expect, it } from 'vite-plus/test';

import { setState } from '../format-helpers/shared';
import { createLockEnforcer } from './locks';
import { posttransformValue } from './post-transform';
import { pretransformValue } from './pre-transform';

const lockOf = (path: Array<string | number>, value: unknown) => ({
  path,
  value: pretransformValue(value as never, new Map(), new Map()) as never,
});

function setup(state: Record<string, any>) {
  const { setLocks, enforce } = createLockEnforcer(
    () => state,
    (path, value) => setState(state, [...path], value),
  );
  return { state, setLocks, enforce };
}

describe('createLockEnforcer', () => {
  it('restores a changed value and reports what the game tried', () => {
    const { state, setLocks, enforce } = setup({ hp: 10, player: { gold: 5 } });
    const locks = [lockOf(['hp'], 10), lockOf(['player', 'gold'], 5)];
    setLocks(locks);

    expect(enforce()).toEqual([]);

    state.hp = 3;
    state.player.gold = 6;
    expect(enforce()).toEqual([
      { path: ['hp'], attempted: 3 },
      { path: ['player', 'gold'], attempted: 6 },
    ]);
    expect(state).toEqual({ hp: 10, player: { gold: 5 } });
  });

  it('puts back a deleted property, but ignores a lock whose container does not exist', () => {
    const { state, setLocks, enforce } = setup({ player: { gold: 5 } });
    const locks = [lockOf(['player', 'gold'], 5), lockOf(['gone', 'deeper'], 1)];
    setLocks(locks);

    delete state.player.gold;
    expect(enforce()).toEqual([{ path: ['player', 'gold'], attempted: undefined }]);
    expect(state).toEqual({ player: { gold: 5 } });

    delete state.player;
    expect(enforce()).toEqual([]);
    expect(state).toEqual({});
  });

  it('keeps an array index locked for as long as the item before it exists', () => {
    const { state, setLocks, enforce } = setup({ items: [1, 2, 3] });
    const locks = [lockOf(['items', 2], 3)];
    setLocks(locks);

    state.items.pop();
    expect(enforce()).toEqual([{ path: ['items', 2], attempted: undefined }]);
    expect(state.items).toEqual([1, 2, 3]);

    state.items.length = 1;
    expect(enforce()).toEqual([]);
    expect(state.items).toEqual([1]);
  });

  describe('inside a Map', () => {
    it('finds number keys and string keys that look like numbers', () => {
      const { state, setLocks, enforce } = setup({
        numbers: new Map<unknown, unknown>([[1, 'a']]),
        strings: new Map<unknown, unknown>([['1', 'a']]),
      });
      const locks = [lockOf(['numbers', '1'], 'a'), lockOf(['strings', '1'], 'a')];
      setLocks(locks);

      state.numbers.set(1, 'x');
      state.strings.set('1', 'x');
      expect(enforce()).toHaveLength(2);
      expect(state.numbers).toEqual(new Map([[1, 'a']]));
      expect(state.strings).toEqual(new Map([['1', 'a']]));
    });

    it('puts a deleted entry back under the kind of key the map uses', () => {
      const { state, setLocks, enforce } = setup({
        numbers: new Map<unknown, unknown>([
          [1, 'a'],
          [2, 'b'],
        ]),
        empty: new Map<unknown, unknown>(),
        mixed: new Map<unknown, unknown>([
          [1, 'a'],
          ['name', 'b'],
        ]),
      });
      const locks = [
        lockOf(['numbers', '2'], 'b'),
        lockOf(['empty', '5'], 'c'),
        lockOf(['mixed', 'name'], 'b'),
      ];
      setLocks(locks);

      state.numbers.delete(2);
      state.mixed.delete('name');
      enforce();
      expect([...state.numbers.keys()]).toEqual([1, 2]);
      expect([...state.empty.keys()]).toEqual([5]);
      expect([...state.mixed.keys()]).toEqual([1, 'name']);
    });

    it('restores a whole map with the keys it had', () => {
      const original = new Map<unknown, unknown>([
        [1, 'a'],
        ['name', 'b'],
      ]);
      const strings = new Map<unknown, unknown>([['1', 'a']]);
      const { state, setLocks, enforce } = setup({
        numbers: new Map(original),
        strings: new Map(strings),
      });

      state.numbers.set(2, 'c');
      state.strings.set('2', 'c');
      setLocks([lockOf(['numbers'], original), lockOf(['strings'], strings)]);
      enforce();
      expect(state.numbers).toEqual(original);
      expect(state.strings).toEqual(strings);
    });
  });

  it('locks a path, not the object that was there: a reorder gets undone', () => {
    const { state, setLocks, enforce } = setup({ list: [{ id: 1 }, { id: 2 }] });

    state.list.reverse();
    setLocks([lockOf(['list', 0], { id: 1 })]);
    enforce();
    expect(state.list).toEqual([{ id: 1 }, { id: 1 }]);
  });

  it('restores Maps, Sets and Dates as what they were', () => {
    const original = {
      map: new Map<string, unknown>([['a', 1]]),
      set: new Set([1, 2]),
      when: new Date(2024, 4, 3, 12, 30, 15),
    };
    const { state, setLocks, enforce } = setup(structuredClone(original));
    const locks = [
      lockOf(['map'], original.map),
      lockOf(['set'], original.set),
      lockOf(['when'], original.when),
    ];
    setLocks(locks);

    state.map.set('b', 2);
    state.set.add(3);
    state.when = new Date(2000, 0, 1);

    expect(enforce().map((revert) => revert.path[0])).toEqual(['map', 'set', 'when']);
    expect(state.map).toEqual(original.map);
    expect(state.set).toEqual(original.set);
    expect(state.when).toEqual(original.when);
  });

  describe('a game that keeps trying to write to a lock', () => {
    it('is only reported the first time it tries the same value', () => {
      const { state, setLocks, enforce } = setup({ hp: 10 });
      const locks = [lockOf(['hp'], 10)];
      setLocks(locks);

      state.hp = 3;
      expect(enforce()).toEqual([{ path: ['hp'], attempted: 3 }]);
      state.hp = 3;
      expect(enforce()).toEqual([]);
      expect(state.hp).toBe(10);

      state.hp = 4;
      expect(enforce()).toEqual([{ path: ['hp'], attempted: 4 }]);
    });

    it('is reported again after it stopped, and after the locks were set again', () => {
      const { state, setLocks, enforce } = setup({ hp: 10 });
      const locks = [lockOf(['hp'], 10)];
      setLocks(locks);

      state.hp = 3;
      enforce();
      enforce();
      state.hp = 3;
      expect(enforce()).toEqual([{ path: ['hp'], attempted: 3 }]);

      state.hp = 3;
      setLocks([lockOf(['hp'], 10)]);
      expect(enforce()).toEqual([{ path: ['hp'], attempted: 3 }]);
    });
  });
});

describe('posttransformValue', () => {
  it('refuses functions', () => {
    const fn = pretransformValue((() => 1) as never, new Map(), new Map());
    expect(() => posttransformValue(fn)).toThrow(/function/);
  });
});
