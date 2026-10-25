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
