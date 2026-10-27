import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { getStatePath } from '@/devtools-panel/store/state-location';
import {
  clearFilteredPaths,
  getFilteredPaths,
  getNavigationPage,
  isPinned,
  togglePin,
} from '@/devtools-panel/store/store';
import { ContextMenuUI } from '@/devtools-panel/ui/util/ContextMenu';
import { PromptDialogOutlet } from '@/devtools-panel/ui/util/Prompt';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

import { createPathMenu } from './create-path-menu';

// jsdom does not open a dialog with showModal
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
  this.removeAttribute('open');
};

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  deleteFromState: vi.fn(async () => {}),
  setState: vi.fn(async () => ({ ok: true })),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
  clearFilteredPaths();
  vi.mocked(setState).mockClear();
  if (isPinned(['flag'])) togglePin(['flag']);
  flush();
});

async function setup(path: Path, { locked }: { locked?: Path } = {}) {
  const game = createGame({
    flag: true,
    list: [5, 6],
    outer: { inner: { x: 1 } },
    flags: new Set([true]),
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  if (locked) await setPathLock(locked, true);

  render(() => (
    <div data-testid="target" onContextMenu={createPathMenu(() => path)}>
      <ContextMenuUI />
      <PromptDialogOutlet />
    </div>
  ));
  screen
    .getByTestId('target')
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  return screen.findByText('Duplicate');
}

const item = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name });

it('has lock, pin, filter, duplicate and delete for a value, under its path', async () => {
  await setup(['flag']);
  expect(['Lock', 'Pin', 'Filter path', 'Duplicate', 'Delete'].map((n) => item(n))).toHaveLength(5);
  expect(screen.getByText('State')).toBeTruthy();
});

it('pins the value', async () => {
  await setup(['flag']);
  item('Pin').click();
  flush();
  expect(isPinned(['flag'])).toBe(true);
});

it('filters the path out of the diff log, once', async () => {
  await setup(['outer', 'inner']);
  item('Filter path').click();
  flush();
  expect(getFilteredPaths()).toEqual([['outer', 'inner']]);
});

it('holds what is inside a locked container', async () => {
  await setup(['outer', 'inner'], { locked: ['outer'] });
  expect(item('Lock').disabled).toBe(true);
  expect(item('Duplicate').disabled).toBe(true);
  expect(item('Delete').disabled).toBe(true);
});

it('does not duplicate or lock the items of a set', async () => {
  await setup(['flags', 1]);
  expect(item('Duplicate').disabled).toBe(true);
  expect(item('Lock').disabled).toBe(true);
});

it('adds a copy of an array item at the end of the array', async () => {
  await setup(['list', 0]);
  item('Duplicate').click();
  await waitFor(() => expect(setState).toHaveBeenCalledWith(['list', 2], 5, { deep: false }));
});

it('asks for the name of the copy of an object value', async () => {
  await setup(['outer', 'inner']);
  item('Duplicate').click();

  const input = await screen.findByLabelText<HTMLInputElement>('Name of the copy');
  expect(input.value).toBe('inner_copy');
  screen.getByRole('button', { name: 'Duplicate' }).click();

  await waitFor(() =>
    expect(setState).toHaveBeenCalledWith(['outer', 'inner_copy'], { x: 1 }, { deep: true }),
  );
});

it('has no menu for the state itself', () => {
  const game = createGame({ flag: true });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  render(() => (
    <div data-testid="target" onContextMenu={createPathMenu(() => [])}>
      <ContextMenuUI />
    </div>
  ));
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
  screen.getByTestId('target').dispatchEvent(event);
  expect(screen.queryByText('Duplicate')).toBeNull();
});

it('offers Unlock for a value that is locked', async () => {
  await setup(['flag'], { locked: ['flag'] });
  expect(item('Unlock').disabled).toBe(false);
});

it('leaves out Duplicate and Delete when asked, for a list that is not the State view', async () => {
  const game = createGame({ flag: true });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  render(() => (
    <div
      data-testid="target"
      onContextMenu={createPathMenu(() => ['flag'], { canReshape: false, canShowInState: true })}
    >
      <ContextMenuUI />
    </div>
  ));
  screen
    .getByTestId('target')
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

  await screen.findByText('Filter path');
  expect(screen.getByText('Lock')).not.toBeNull();
  expect(screen.getByText('Pin')).not.toBeNull();
  expect(screen.queryByText('Duplicate')).toBeNull();
  expect(screen.queryByText('Delete')).toBeNull();

  screen.getByText('Show in State view').click();
  flush();
  expect(getNavigationPage()).toBe('state');
  expect(getStatePath()).toEqual(['flag']);
});
