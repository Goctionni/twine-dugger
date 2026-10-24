import { cleanup, render, within } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import {
  getScrollToTrigger,
  getStatePath,
  setStatePath,
} from '@/devtools-panel/store/state-location';
import { createGame } from '@/devtools-panel/store/test-game';

import { StateView } from './StateView';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

// jsdom has no layout: no scrolling, and nothing to observe the size of
Element.prototype.scrollIntoView = () => {};
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(cleanup);

it('selects the crumb that is clicked and asks to scroll to the selection', () => {
  const game = createGame({ stats: { str: 1 } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  setStatePath(['stats', 'str']);
  flush();

  const { getByRole } = render(() => <StateView />);
  const before = getScrollToTrigger();

  within(getByRole('navigation', { name: 'Path' }))
    .getByText('stats')
    .click();
  flush();

  expect(getStatePath()).toEqual(['stats']);
  expect(getScrollToTrigger()).toBe(before + 1);
});

it('shows the navigator, the breadcrumbs and the inspector of the selection', () => {
  const game = createGame({ stats: { str: 1 } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  setStatePath(['stats']);
  flush();

  const { getByRole } = render(() => <StateView />);

  expect(getByRole('tree', { name: 'State' })).toBeTruthy();
  expect(getByRole('navigation', { name: 'Path' })).toBeTruthy();
  expect(getByRole('heading', { name: 'stats' })).toBeTruthy();
});
