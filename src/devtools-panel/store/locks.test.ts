import { flush } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createGame } from './test-game';

const setStatePropertyLocks = vi.fn<(locks: unknown) => Promise<void>>(async () => {});
vi.mock('../api/api', () => ({ getPassageData: async () => [], setStatePropertyLocks }));

const { applyUpdate, getDiffFrames, startGameState } = await import('./game-state');
const { clearLocks, getLockedPaths, isPathLockable, setPathLock } = await import('./locks');

beforeEach(() => {
  clearLocks();
  flush();
});

describe('locks', () => {
  it('stores the locked value and hands the locks to the content script', () => {
    const game = createGame({ hp: 10, inv: [{ id: 1 }] });
    startGameState(game.state());
    flush();

    setPathLock(['hp'], true);
    setPathLock(['inv'], true);

    expect(getLockedPaths()).toEqual([['hp'], ['inv']]);
    expect(setStatePropertyLocks).toHaveBeenLastCalledWith([
      { path: ['hp'], value: 10 },
      { path: ['inv'], value: [{ id: 1 }] },
    ]);

    setPathLock(['hp'], false);
    expect(getLockedPaths()).toEqual([['inv']]);
  });

  it('refuses to lock functions, and says so', () => {
    const game = createGame({ onHit: () => 1, nested: { fn: () => 2 } });
    startGameState(game.state());
    flush();

    expect(isPathLockable(['onHit'])).toBe(false);
    expect(isPathLockable(['nested'])).toBe(false);
    expect(() => setPathLock(['onHit'], true)).toThrow(/function/);
    expect(() => setPathLock(['missing'], true)).toThrow(/no value/);
  });

  it('logs the writes that a lock blocked, next to what the lock is at', () => {
    const game = createGame({ hp: 10 });
    startGameState(game.state());
    setPathLock(['hp'], true);

    applyUpdate({
      type: 'update',
      passage: 'P',
      delta: undefined,
      reverts: [{ path: ['hp'], attempted: 3 }],
    });
    flush();

    const [frame] = getDiffFrames();
    expect(frame!.delta).toBeUndefined();
    expect(frame!.blocked).toEqual([{ path: ['hp'], attempted: 3, locked: 10 }]);
  });

  it('ignores the writes that a lock that was removed blocked', () => {
    const game = createGame({ hp: 10 });
    startGameState(game.state());
    flush();

    applyUpdate({
      type: 'update',
      passage: 'P',
      delta: undefined,
      reverts: [{ path: ['hp'], attempted: 3 }],
    });
    flush();
    expect(getDiffFrames()).toHaveLength(0);
  });
});
