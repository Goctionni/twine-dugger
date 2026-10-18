import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from './game-state';
import { getRevealCount, setStatePath, showInStateView } from './state-location';
import { setViewState, store } from './store';
import { createGame } from './test-game';

vi.mock('../api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

const path = () => [...store.viewState.state.path];

afterEach(() => {
  setViewState('state', 'path', []);
  flush();
});

function start() {
  const game = createGame({ hp: 10, stats: { str: 1 }, inv: [1, 2] });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
}

it('sets a path that is in the state', () => {
  start();
  expect(setStatePath(['stats', 'str'])).toBe(true);
  flush();
  expect(path()).toEqual(['stats', 'str']);

  expect(setStatePath(['inv', 1])).toBe(true);
  flush();
  expect(path()).toEqual(['inv', 1]);

  expect(setStatePath([])).toBe(true);
});

it('does not set a path that is not in the state, nor one that goes through a value', () => {
  start();
  setStatePath(['stats']);
  flush();

  expect(setStatePath(['stats', 'gone'])).toBe(false);
  expect(setStatePath(['hp', 'deeper'])).toBe(false);
  expect(setStatePath(['inv', 2])).toBe(false);
  expect(setStatePath(['missing'])).toBe(false);
  flush();
  expect(path()).toEqual(['stats']);
});

it('asks for the reveal only when the path is set', () => {
  start();
  const before = getRevealCount();

  showInStateView(['missing']);
  flush();
  expect(getRevealCount()).toBe(before);

  showInStateView(['stats']);
  flush();
  expect(getRevealCount()).toBe(before + 1);
  expect(path()).toEqual(['stats']);
});
