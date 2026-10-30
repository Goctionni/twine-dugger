import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { createGame } from '@/testing/test-game';

import { DiffLog } from './index';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

afterEach(cleanup);

it('says so when nothing has changed yet, and stops saying so when something does', () => {
  const game = createGame({ hp: 10 });
  startGameState(game.state());
  flush();

  const { queryByText } = render(() => <DiffLog />);
  expect(queryByText('No changes yet')).toBeTruthy();

  game.live.hp = 9;
  applyUpdate(game.update());
  flush();
  expect(queryByText('No changes yet')).toBeNull();
});

it('shows a Date that is added, and one that changes, without crashing', () => {
  const game = createGame({ when: new Date(2020, 0, 2, 3, 4, 5) });
  startGameState(game.state());
  flush();

  const { container } = render(() => <DiffLog />);
  game.live.when = new Date(2021, 5, 6, 7, 8, 9);
  game.live.added = new Date(2022, 0, 1);
  game.live.list = [new Date(2023, 0, 1)];
  applyUpdate(game.update());
  flush();

  expect(container.textContent).toContain('added');
  expect(container.textContent).toContain('2022-01-01 00:00:00');
});
