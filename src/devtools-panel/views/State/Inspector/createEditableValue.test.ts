import { createRoot, createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

import { createEditableValue } from './createEditableValue';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
  setState: vi.fn(async () => {}),
}));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.mocked(setState).mockClear();
});

function setup() {
  const game = createGame({ flag: true, other: 1 });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  let dispose = () => {};
  const [getValue, set] = createRoot((d) => {
    dispose = d;
    return createEditableValue<boolean>(() => ['flag']);
  });
  // The game takes a value the way the poll brings it: as an update
  const game_ = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  return { getValue, set, game: game_, dispose };
}

it('shows what is set at once, sends it, and keeps it when the state gets it', async () => {
  const { getValue, set, game, dispose } = setup();
  expect(getValue()).toBe(true);

  const done = set(false);
  flush();
  expect(getValue()).toBe(false);
  expect(setState).toHaveBeenCalledWith(['flag'], false);

  game((live) => (live.flag = false));
  await done;
  flush();
  expect(getValue()).toBe(false);
  dispose();
});

it('goes back to what the state has when the state does not get the value in time', async () => {
  const { getValue, set, dispose } = setup();

  const done = set(false);
  flush();
  expect(getValue()).toBe(false);

  await vi.advanceTimersByTimeAsync(1300);
  await done;
  flush();
  expect(getValue()).toBe(true);
  dispose();
});

it('follows the state for what is not set from the editor', () => {
  const { getValue, game, dispose } = setup();
  game((live) => (live.flag = false));
  expect(getValue()).toBe(false);
  game((live) => (live.flag = true));
  expect(getValue()).toBe(true);
  dispose();
});

it('goes back, and says why, when the value could not be sent', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(setState).mockRejectedValueOnce(new Error('no connection'));
  const { getValue, set, dispose } = setup();

  const done = set(false);
  flush();
  await done;
  flush();

  expect(getValue()).toBe(true);
  expect(error).toHaveBeenCalledWith('Failed to set the value:', expect.any(Error));
  error.mockRestore();
  dispose();
});

it('ignores a second value while the first is waiting for the game', async () => {
  const { getValue, set, game, dispose } = setup();

  const first = set(false);
  flush();
  void set(true);
  flush();
  expect(vi.mocked(setState).mock.calls).toEqual([[['flag'], false]]);
  expect(getValue()).toBe(false);

  game((live) => (live.flag = false));
  await first;
  flush();
  expect(getValue()).toBe(false);
  dispose();
});

it('does not show what was set on another value, also one that holds the same value', async () => {
  const game = createGame({ flag: true, other: true });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(['flag']);
  let dispose = () => {};
  const [getValue, set] = createRoot((d) => {
    dispose = d;
    return createEditableValue<boolean>(getPath);
  });

  void set(false);
  flush();
  expect(getValue()).toBe(false);

  setPath(['other']);
  flush();
  await vi.advanceTimersByTimeAsync(0);
  flush();
  expect(getValue()).toBe(true);
  dispose();
});

it('keeps what was set when the same path is set again', async () => {
  const game = createGame({ flag: true });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(['flag']);
  let dispose = () => {};
  const [getValue, set] = createRoot((d) => {
    dispose = d;
    return createEditableValue<boolean>(getPath);
  });

  void set(false);
  flush();
  setPath(['flag']);
  flush();
  expect(getValue()).toBe(false);

  await vi.advanceTimersByTimeAsync(1300);
  flush();
  expect(getValue()).toBe(true);
  dispose();
});
