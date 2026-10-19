import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { ContainerEditor } from './ContainerEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
}));

afterEach(cleanup);

function setup(path: Path) {
  const game = createGame({
    group: { a: 1, b: 2, c: 3 },
    one: { x: 1 },
    list: [1, 2],
    flags: new Set([1]),
    map: new Map([['k', 1]]),
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  return render(() => <ContainerEditor path={path} />);
}

it('names the container, and counts its entries', () => {
  const view = setup(['group']);
  expect(view.getByRole('heading').textContent).toBe('group');
  expect(view.getByText('3 entries')).toBeTruthy();
  cleanup();

  expect(setup(['one']).getByText('1 entry')).toBeTruthy();
});

it('counts the entries of the state itself, which has no pin and delete', () => {
  const view = setup([]);
  expect(view.getByRole('heading').textContent).toBe('State');
  expect(view.getByText('5 entries')).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Pin' })).toBeNull();
});

it('has buttons to add and to edit as JSON, which do nothing yet', () => {
  const view = setup(['group']);
  expect(view.getByRole('button', { name: 'Add property' })).toBeTruthy();
  expect(view.getByRole<HTMLButtonElement>('button', { name: 'Edit as JSON' }).disabled).toBe(true);
});

it('says item for what has no names', () => {
  for (const path of [['list'], ['flags']]) {
    const view = setup(path);
    expect(view.getByRole('button', { name: 'Add item' })).toBeTruthy();
    cleanup();
  }
  expect(setup(['map']).getByRole('button', { name: 'Add property' })).toBeTruthy();
});
