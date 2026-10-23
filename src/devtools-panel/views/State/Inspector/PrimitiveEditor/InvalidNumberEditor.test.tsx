import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { PrimitiveEditor } from './PrimitiveEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setState).mockClear();
});

function setup(path: Path) {
  const game = createGame({ score: 7, broken: Number.NaN, huge: -Infinity, text: 'a' });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <PrimitiveEditor path={path} onSelect={() => {}} />);
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  return { ...view, play };
}

it('shows NaN as text, and offers Set to 0 when nothing is known of an earlier value', () => {
  const { getByRole, getAllByText } = setup(['broken']);
  expect(getAllByText('NaN', { selector: 'code' })[0]).toBeTruthy();

  getByRole('button', { name: 'Set to 0' }).click();
  expect(setState).toHaveBeenCalledWith(['broken'], 0);
});

it('offers Revert to the last number it had, and writes it', () => {
  const { getByRole, play } = setup(['score']);
  play((live) => (live.score = Number.NaN));

  getByRole('button', { name: 'Revert' }).click();
  expect(setState).toHaveBeenCalledWith(['score'], 7);
});

it('skips earlier values that are NaN or infinite too', () => {
  const { getByRole, play } = setup(['score']);
  play((live) => (live.score = 9));
  play((live) => (live.score = Infinity));
  play((live) => (live.score = Number.NaN));

  getByRole('button', { name: 'Revert' }).click();
  expect(setState).toHaveBeenCalledWith(['score'], 9);
});

it('shows an infinity with its sign', () => {
  const { getAllByText } = setup(['huge']);
  expect(getAllByText('-Infinity', { selector: 'code' })[0]).toBeTruthy();
});

it('cannot be written while the value is locked', async () => {
  const { getByRole } = setup(['broken']);
  await setPathLock(['broken'], true);
  flush();
  expect(getByRole<HTMLButtonElement>('button', { name: 'Set to 0' }).disabled).toBe(true);
});
