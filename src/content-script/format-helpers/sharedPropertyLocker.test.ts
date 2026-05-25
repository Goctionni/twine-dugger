import { describe, expect, it, vi } from 'vite-plus/test';

import { createPropertyLocker } from './sharedPropertyLocker';

describe('sharedPropertyLocker', () => {
  it('should add and remove path locks without duplicates', () => {
    const locker = createPropertyLocker(
      () => ({ player: { hp: 10 } }),
      () => {},
    );

    const first = locker.setPathLock(['player', 'hp'], true);
    const second = locker.setPathLock(['player', 'hp'], true);
    const removed = locker.setPathLock(['player', 'hp'], false);

    expect(first).toEqual([['player', 'hp']]);
    expect(second).toEqual([['player', 'hp']]);
    expect(removed).toEqual([]);
  });

  it('should filter locked diffs and restore lock value', () => {
    const setStateFn = vi.fn();
    const locker = createPropertyLocker(() => ({ player: { hp: 10, mp: 5 } }), setStateFn);

    locker.setPathLock(['player'], true);

    const result = locker.processDiffs([
      {
        type: 'number',
        path: ['player', 'hp'],
        oldValue: 10,
        newValue: 20,
      },
    ]);

    expect(result.diffs).toEqual([]);
    expect(result.locksUpdate).toBeNull();
    expect(setStateFn).toHaveBeenCalledWith(['player'], { hp: 10, mp: 5 });
  });

  it('should remove descendant locks when remove diff deletes parent', () => {
    const locker = createPropertyLocker(
      () => ({ player: { stats: { hp: 10 }, name: 'x' } }),
      () => {},
    );

    locker.setPathLock(['player', 'stats', 'hp'], true);

    const result = locker.processDiffs([
      {
        type: 'object',
        subtype: 'remove',
        path: ['player'],
        key: 'stats',
        oldValue: { hp: 10 },
      },
    ]);

    expect(result.diffs).toHaveLength(1);
    expect(result.locksUpdate).toEqual([]);
  });

  it('should keep unlocked diffs unchanged', () => {
    const setStateFn = vi.fn();
    const locker = createPropertyLocker(() => ({ player: { hp: 10 } }), setStateFn);

    const diffs = [
      {
        type: 'number' as const,
        path: ['player', 'hp'],
        oldValue: 10,
        newValue: 11,
      },
    ];
    const result = locker.processDiffs(diffs);

    expect(result.diffs).toEqual(diffs);
    expect(result.locksUpdate).toBeNull();
    expect(setStateFn).not.toHaveBeenCalled();
  });

  it('should compute array diff full path and return remaining locks update list', () => {
    const locker = createPropertyLocker(
      () => ({ arr: [{ hp: 1 }, { hp: 2 }], keep: { x: 1 } }),
      () => {},
    );

    locker.setPathLock(['arr', 1, 'hp'], true);
    locker.setPathLock(['keep', 'x'], true);

    const result = locker.processDiffs([
      {
        type: 'array',
        subtype: 'remove',
        path: ['arr'],
        index: 1,
        oldValue: { hp: 2 },
      },
    ]);

    expect(result.diffs).toHaveLength(1);
    expect(result.locksUpdate).toEqual([['keep', 'x']]);
  });
});
