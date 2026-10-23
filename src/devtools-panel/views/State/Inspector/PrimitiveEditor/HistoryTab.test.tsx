import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { HistoryTab } from './HistoryTab';

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
  const game = createGame({ score: 10, name: 'Alex', group: { on: true } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <HistoryTab path={path} />);
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  const rows = () => view.queryAllByRole('listitem');
  const restoreButtons = () =>
    view.queryAllByRole<HTMLButtonElement>('button', { name: 'Restore' });
  return { ...view, play, rows, restoreButtons };
}

it('says so when nothing changed', () => {
  const { getByText } = setup(['score']);
  expect(getByText('No changes seen since the panel opened.')).toBeTruthy();
});

it('lists the changes, newest first, with the number it went up or down by', () => {
  const { play, rows } = setup(['score']);
  play((live) => (live.score = 13));
  play((live) => (live.score = 12));

  expect(rows()).toHaveLength(3);
  expect(rows()[0]!.textContent).toContain('12');
  expect(rows()[0]!.textContent).toContain('−1');
  expect(rows()[0]!.textContent).toContain('Current');
  expect(rows()[1]!.textContent).toContain('13');
  expect(rows()[1]!.textContent).toContain('+3');
  expect(rows()[2]!.textContent).toContain('before the first change seen');
});

it('restores the value of a row', () => {
  const { play, restoreButtons } = setup(['score']);
  play((live) => (live.score = 13));
  play((live) => (live.score = 12));

  restoreButtons()[0]!.click();
  expect(setState).toHaveBeenCalledWith(['score'], 13);
  restoreButtons()[1]!.click();
  expect(setState).toHaveBeenLastCalledWith(['score'], 10);
});

it('cannot restore when the value is locked, or a parent is', async () => {
  const { play, restoreButtons } = setup(['group', 'on']);
  play((live) => (live.group.on = false));
  expect(restoreButtons()[0]!.disabled).toBe(false);

  await setPathLock(['group'], true);
  flush();
  expect(restoreButtons().every((button) => button.disabled)).toBe(true);
});

it('shows the first five changes and the rest on request', () => {
  const { play, rows, getByText } = setup(['score']);
  for (let value = 11; value <= 17; value++) play((live) => (live.score = value));

  expect(rows()).toHaveLength(5);
  getByText('Show older (2)').click();
  flush();
  expect(rows()).toHaveLength(8);
});

it('starts short again when another value is selected', () => {
  const game = createGame({ score: 10, other: 1 });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  for (let value = 11; value <= 17; value++) {
    game.live.score = value;
    applyUpdate(game.update());
    flush();
  }
  for (let value = 2; value <= 8; value++) {
    game.live.other = value;
    applyUpdate(game.update());
    flush();
  }

  const [getPath, setPath] = createSignal<Path>(['score']);
  const view = render(() => <HistoryTab path={getPath()} />);
  view.getByText('Show older (2)').click();
  flush();
  expect(view.queryAllByRole('listitem')).toHaveLength(8);

  setPath(['other']);
  flush();
  expect(view.queryAllByRole('listitem')).toHaveLength(5);
});

it('does not restore a value that is NaN, an infinity or undefined', () => {
  const { play, restoreButtons } = setup(['score']);
  play((live) => (live.score = Number.NaN));
  play((live) => (live.score = 12));

  // 12 is current; NaN (before 12) cannot be written; 10 (before the NaN) can
  const buttons = restoreButtons();
  expect(buttons).toHaveLength(2);
  expect(buttons.map((button) => button.disabled)).toEqual([true, false]);
});
