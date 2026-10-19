import { createEffect, createRoot, flush, snapshot } from 'solid-js';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';

import { pretransformState } from '@/content-script/util/pre-transform';

import { getDiffFromDelta } from './diff-from-delta';
import {
  applyUpdate,
  createFrameLimitEffect,
  getDiffFrames,
  getLatestState,
  getPathRecord,
  isFrameTainted,
  restartGameState,
  startGameState,
} from './game-state';
import { addFilteredPath, removeFilteredPath, setSetting, setViewState, store } from './store';
import { createGame } from './test-game';

vi.mock('../api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

type Game = ReturnType<typeof createGame>;

const state = () => getLatestState() as any;

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

    expect(snapshot(state())).toEqual(structuredClone(pretransformState(game.live)[0]));

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

  it('trims the path of the State view to the part that is still in the state', () => {
    const game = createGame({ a: { b: { c: 1 }, keep: 1 }, list: [1, 2] });
    startGameState(game.state());
    flush();
    const selectPath = (path: (string | number)[]) => {
      setViewState('state', 'path', path);
      flush();
    };

    selectPath(['a', 'b', 'c']);
    play(game, (s) => (s.a.keep = 2));
    expect([...store.viewState.state.path]).toEqual(['a', 'b', 'c']);

    play(game, (s) => delete s.a.b.c);
    expect([...store.viewState.state.path]).toEqual(['a', 'b']);

    play(game, (s) => delete s.a.b);
    expect([...store.viewState.state.path]).toEqual(['a']);

    selectPath(['list', 1]);
    play(game, (s) => s.list.pop());
    expect([...store.viewState.state.path]).toEqual(['list']);

    selectPath(['a', 'keep']);
    restartGameState(structuredClone({ a: {} }) as any, 'start');
    flush();
    expect([...store.viewState.state.path]).toEqual(['a']);
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

  it('keeps the log across a reload, and marks what is before it as tainted', () => {
    const game = createGame({ hp: 10 });
    startGameState(game.state());
    flush();
    play(game, (s) => (s.hp = 9));
    play(game, (s) => (s.hp = 8));

    game.live.hp = 100;
    const reloaded = createGame(game.live);
    restartGameState(reloaded.state(), 'P');
    flush();
    play(reloaded, (s) => (s.hp = 99));

    const frames = getDiffFrames();
    expect(frames.map((frame) => frame.id)).toEqual([4, 3, 2, 1]);
    expect(frames[1]!.reloaded).toBe(true);
    expect(frames.map((frame) => isFrameTainted(frame))).toEqual([false, false, true, true]);
  });

  describe('path records', () => {
    const values = (path: (string | number)[]) =>
      getPathRecord(path)?.changes.map(({ change }) =>
        change.kind === 'chg' ? change.newValue : change.kind,
      );

    it('keeps the changes of each path, newest first, and clears them on a reload', () => {
      const game = createGame({ hp: 10, other: 1 });
      startGameState(game.state());
      flush();
      play(game, (s) => (s.hp = 9));
      play(game, (s) => (s.other = 2));
      play(game, (s) => (s.hp = 8));

      expect(values(['hp'])).toEqual([8, 9]);
      expect(getPathRecord(['hp'])).toMatchObject({ count: 2, lastId: 3 });
      expect(values(['other'])).toEqual([2]);
      expect(getPathRecord(['nothing'])).toBeUndefined();

      restartGameState(game.state(), 'P');
      flush();
      expect(getPathRecord(['hp'])).toBeUndefined();
    });

    it('forgets the changes that leave the window, but keeps counting them', () => {
      onTestFinished(() => setSetting('diffLog.maxHistorySlices', 30));
      setSetting('diffLog.maxHistorySlices', 2);
      const game = createGame({ hp: 10 });
      startGameState(game.state());
      flush();
      for (let hp = 9; hp > 5; hp--) play(game, (s) => (s.hp = hp));

      expect(values(['hp'])).toEqual([6, 7]);
      expect(getPathRecord(['hp'])?.count).toBe(4);
    });

    it('does not record paths that are filtered, and deletes records that are old', () => {
      const game = createGame({ hp: 10, x: 0 });
      startGameState(game.state());
      flush();
      addFilteredPath(['x']);
      flush();
      onTestFinished(() => removeFilteredPath(['x']));

      play(game, (s) => (s.x = 1));
      play(game, (s) => (s.hp = 9));
      expect(getPathRecord(['x'])).toBeUndefined();

      for (let n = 0; n < 1001; n++) play(game, (s) => (s.x = n + 2));
      expect(getPathRecord(['hp'])).toBeUndefined();
    });
  });

  describe('createFrameLimitEffect', () => {
    const setup = () => {
      createRoot((dispose) => {
        createFrameLimitEffect();
        onTestFinished(dispose);
      });
      onTestFinished(() => setSetting('diffLog.maxHistorySlices', 30));
      const game = createGame({ hp: 10 });
      startGameState(game.state());
      flush();
      return game;
    };

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
