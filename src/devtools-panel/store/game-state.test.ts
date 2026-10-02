import { createEffect, createRoot, flush } from 'solid-js';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';

import { pretransformState } from '@/content-script/util/pre-transform';

import { getDiffFromDelta } from './diff-from-delta';
import {
  applyUpdate,
  createHistoryEffects,
  getActiveState,
  getDiffFrames,
  getHistoryIds,
  isFrameTainted,
  restartGameState,
  startGameState,
} from './game-state';
import { setSetting, setViewState } from './store';
import { createGame } from './test-game';

vi.mock('../api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

type Game = ReturnType<typeof createGame>;

const state = () => getActiveState() as any;

function play(game: Game, mutate: (live: any) => void) {
  mutate(game.live);
  applyUpdate(game.update());
  flush();
}

describe('game state', () => {
  it('applies deltas, lists their changes and rebuilds older states', () => {
    const game = createGame({
      hp: 10,
      name: 'a',
      inv: [{ item: 'sword' }, { item: 'shield' }],
      ids: [{ id: 1 }, { id: 2 }, { id: 3 }],
      map: new Map([['x', 1]]),
      set: new Set([1, 2]),
    });
    startGameState(game.state());
    flush();

    play(game, (s) => (s.hp = 9));
    play(game, (s) => (s.inv[1].item = 'bow'));
    play(game, (s) => s.inv.push({ item: 'potion' }));
    play(game, (s) => s.ids.reverse());
    play(game, (s) => {
      s.map.set('y', 2);
      s.set.add(3);
      s.name = 5;
    });
    play(game, (s) => delete s.hp);

    expect(JSON.parse(JSON.stringify(state()))).toEqual(
      JSON.parse(JSON.stringify(pretransformState(game.live)[0])),
    );

    const frames = getDiffFrames();
    expect(frames.map((frame) => frame.id)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(
      frames.map((frame) =>
        getDiffFromDelta(frame.delta)
          .map((change) => `${change.kind}:${change.path.join('.')}`)
          .sort(),
      ),
    ).toEqual([
      ['del:hp'],
      ['add:map.y', 'add:set.3', 'typ:name'],
      ['mov:ids'],
      ['add:inv.2'],
      ['chg:inv.1.item'],
      ['chg:hp'],
    ]);

    setViewState('state', 'historyRef', 5);
    flush();
    expect(state().hp).toBe(9);
    setViewState('state', 'historyRef', 0);
    flush();
    expect(state().hp).toBe(10);
    expect(state().inv).toHaveLength(2);
    setViewState('state', 'historyRef', 'latest');
    flush();
    expect(getHistoryIds()).toEqual([6, 5, 4, 3, 2, 1, 0]);
  });

  it('only notifies readers of the properties that changed', () => {
    const game = createGame({ a: 1, b: 2, list: [{ n: 1 }, { n: 2 }, { n: 3 }] });
    startGameState(game.state());
    flush();

    const runs = { a: 0, b: 0, n1: 0, len: 0 };
    createRoot((dispose) => {
      const readers = {
        a: () => state().a,
        b: () => state().b,
        n1: () => state().list[1].n,
        len: () => state().list.length,
      };
      for (const [name, read] of Object.entries(readers)) {
        createEffect(read, () => {
          runs[name as keyof typeof runs]++;
        });
      }
      onTestFinished(dispose);
    });
    flush();
    const before = { ...runs };

    play(game, (s) => (s.b = 20));
    expect(runs).toEqual({ ...before, b: before.b + 1 });

    play(game, (s) => (s.list[1].n = 22));
    expect(runs).toEqual({ ...before, b: before.b + 1, n1: before.n1 + 1 });

    play(game, (s) => s.list.push({ n: 4 }));
    expect(runs).toEqual({ ...before, b: before.b + 1, n1: before.n1 + 1, len: before.len + 1 });
  });

  it('keeps the same proxies for array items that only moved', () => {
    const game = createGame({
      list: [
        { id: 1, n: 1 },
        { id: 2, n: 2 },
      ],
    });
    startGameState(game.state());
    flush();
    const before = state().list[1];

    play(game, (s) => s.list.reverse());
    expect(state().list[0].id).toBe(2);
    expect(state().list[0]).toBe(before);
  });

  it('keeps the log across a reload, but only lets you travel to what came after it', () => {
    const game = createGame({ hp: 10 });
    startGameState(game.state());
    flush();
    play(game, (s) => (s.hp = 9));
    play(game, (s) => (s.hp = 8));
    expect(getHistoryIds()).toEqual([2, 1, 0]);

    game.live.hp = 100;
    const reloaded = createGame(game.live);
    restartGameState(reloaded.state(), 'P');
    flush();
    play(reloaded, (s) => (s.hp = 99));

    const frames = getDiffFrames();
    expect(frames.map((frame) => frame.id)).toEqual([4, 3, 2, 1]);
    expect(frames[1]!.reloaded).toBe(true);
    expect(frames.map((frame) => isFrameTainted(frame))).toEqual([false, false, true, true]);

    expect(getHistoryIds()).toEqual([4, 3]);
    setViewState('state', 'historyRef', 3);
    flush();
    expect(state().hp).toBe(100);
  });

  describe('createHistoryEffects', () => {
    const setup = () => {
      createRoot((dispose) => {
        createHistoryEffects();
        onTestFinished(dispose);
      });
      onTestFinished(() => setSetting('diffLog.maxHistorySlices', 30));
      const game = createGame({ hp: 10 });
      startGameState(game.state());
      flush();
      return game;
    };

    it('goes back to the latest state when the slice that is looked at is gone', () => {
      const game = setup();
      for (let hp = 9; hp > 5; hp--) play(game, (s) => (s.hp = hp));

      setViewState('state', 'historyRef', 1);
      flush();
      expect(state().hp).toBe(9);

      setSetting('diffLog.maxHistorySlices', 2);
      flush();
      expect(getHistoryIds()).toEqual([4, 3, 2]);
      expect(getActiveState().hp).toBe(6);
    });

    it('keeps no more frames than the setting allows', () => {
      const game = setup();
      for (let hp = 9; hp > 5; hp--) play(game, (s) => (s.hp = hp));
      expect(getDiffFrames()).toHaveLength(4);

      setSetting('diffLog.maxHistorySlices', 2);
      flush();
      expect(getDiffFrames().map((frame) => frame.id)).toEqual([4, 3]);
    });
  });
});
