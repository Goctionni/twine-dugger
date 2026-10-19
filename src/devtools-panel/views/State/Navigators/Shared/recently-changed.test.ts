import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { setSetting } from '@/devtools-panel/store/store';
import { createGame } from '@/devtools-panel/store/test-game';

import { isRecentlyChanged } from './recently-changed';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

afterEach(() => setSetting('state.recentUpdates', 10));

it('marks a value and the containers around it for the last few updates', () => {
  setSetting('state.recentUpdates', 2);
  const game = createGame({ group: { n: 1 }, other: 1 });
  startGameState(game.state());
  flush();
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };

  expect(isRecentlyChanged(['group', 'n'])).toBe(false);

  play((live) => (live.group.n = 2));
  expect(isRecentlyChanged(['group', 'n'])).toBe(true);
  expect(isRecentlyChanged(['group'])).toBe(true);
  expect(isRecentlyChanged(['other'])).toBe(false);

  play((live) => (live.other = 2));
  expect(isRecentlyChanged(['group', 'n'])).toBe(true);

  play((live) => (live.other = 3));
  expect(isRecentlyChanged(['group', 'n'])).toBe(false);
  expect(isRecentlyChanged(['other'])).toBe(true);
});
