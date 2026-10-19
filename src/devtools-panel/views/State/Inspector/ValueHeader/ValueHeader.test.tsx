import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { deleteFromState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { isPinned, togglePin } from '@/devtools-panel/store/store';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { confirmDelete } from './confirmDelete';
import { ValueHeader } from './ValueHeader';

vi.mock('./confirmDelete', () => ({ confirmDelete: vi.fn(async () => true) }));

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  deleteFromState: vi.fn(async () => {}),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(deleteFromState).mockClear();
  vi.mocked(confirmDelete).mockClear();
  if (isPinned(['flag'])) togglePin(['flag']);
  flush();
});

function setup(path: Path) {
  const game = createGame({
    flag: true,
    group: { on: true },
    flags: new Set([true]),
    list: [5, 6],
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <ValueHeader path={path}>under the path</ValueHeader>);
  const remove = () => view.getByRole<HTMLButtonElement>('button', { name: 'Delete' });
  return { ...view, remove };
}

it('names the value, shows where it is, and holds what is given', () => {
  const { getByRole, getByText } = setup(['group', 'on']);
  expect(getByRole('heading').textContent).toBe('on');
  expect(getByText('under the path')).toBeTruthy();
});

it('has no pin and delete for the state itself', () => {
  const { getByRole, queryByRole } = setup([]);
  expect(getByRole('heading').textContent).toBe('State');
  expect(queryByRole('button', { name: 'Pin' })).toBeNull();
  expect(queryByRole('button', { name: 'Delete' })).toBeNull();
});

it('pins and unpins the value', () => {
  const { getByRole } = setup(['flag']);
  const pin = () => getByRole('button', { name: 'Pin' });
  expect(pin().getAttribute('aria-pressed')).toBe('false');

  pin().click();
  flush();
  expect(isPinned(['flag'])).toBe(true);
  expect(pin().getAttribute('aria-pressed')).toBe('true');

  pin().click();
  flush();
  expect(isPinned(['flag'])).toBe(false);
});

it('deletes the value once it is confirmed, and not when it is not', async () => {
  const { remove } = setup(['group', 'on']);

  vi.mocked(confirmDelete).mockResolvedValueOnce(false);
  remove().click();
  await Promise.resolve();
  expect(deleteFromState).not.toHaveBeenCalled();

  remove().click();
  await Promise.resolve();
  expect(confirmDelete).toHaveBeenLastCalledWith('on', { isArrayItem: false, hasContents: false });
  expect(deleteFromState).toHaveBeenCalledWith(['group', 'on']);
});

it('tells the dialog about array items, and about containers', async () => {
  const item = setup(['list', 0]);
  item.remove().click();
  await Promise.resolve();
  expect(confirmDelete).toHaveBeenLastCalledWith('0', { isArrayItem: true, hasContents: false });
  cleanup();

  const group = setup(['group']);
  group.remove().click();
  await Promise.resolve();
  expect(confirmDelete).toHaveBeenLastCalledWith('group', {
    isArrayItem: false,
    hasContents: true,
  });
});

it('cannot delete a value that is locked, locked by a parent, or in a set', async () => {
  const flag = setup(['flag']);
  expect(flag.remove().disabled).toBe(false);
  await setPathLock(['flag'], true);
  flush();
  expect(flag.remove().disabled).toBe(true);
  cleanup();

  const inGroup = setup(['group', 'on']);
  await setPathLock(['group'], true);
  flush();
  expect(inGroup.remove().disabled).toBe(true);
  cleanup();

  expect(setup(['flags', 1]).remove().disabled).toBe(true);
});
