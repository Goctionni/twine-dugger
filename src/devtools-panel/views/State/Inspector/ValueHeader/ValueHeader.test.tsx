import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { deleteFromState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { isPinned, togglePin } from '@/devtools-panel/store/store';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

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

function setup(path: Path, { hasLock = false } = {}) {
  const game = createGame({
    flag: true,
    group: { on: true },
    flags: new Set([true]),
    list: [5, 6],
    tool: { run: () => 1 },
    outer: { inner: { x: 1 } },
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => (
    <ValueHeader path={path} hasLock={hasLock}>
      under the path
    </ValueHeader>
  ));
  const lock = () => view.getByRole<HTMLButtonElement>('button', { name: 'Lock' });
  const remove = () => view.getByRole<HTMLButtonElement>('button', { name: 'Delete' });
  return { ...view, remove, lock };
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

it('cannot delete a container that has something locked inside it, but a sibling is fine', async () => {
  const group = setup(['group']);
  expect(group.remove().disabled).toBe(false);
  await setPathLock(['group', 'on'], true);
  flush();
  expect(group.remove().disabled).toBe(true);
  expect(group.remove().title).toBe('Something inside this value is locked');
  cleanup();

  expect(setup(['flag']).remove().disabled).toBe(false);
});

it('has a lock for the value itself only when asked, and locks and unlocks it', async () => {
  expect(setup(['group']).queryByRole('button', { name: 'Lock' })).toBeNull();
  cleanup();

  const view = setup(['group'], { hasLock: true });
  expect(view.lock().getAttribute('aria-pressed')).toBe('false');
  expect(view.remove().disabled).toBe(false);

  view.lock().click();
  await Promise.resolve();
  flush();
  expect(view.lock().getAttribute('aria-pressed')).toBe('true');
  expect(view.remove().disabled).toBe(true);

  view.lock().click();
  await Promise.resolve();
  flush();
  expect(view.lock().getAttribute('aria-pressed')).toBe('false');
});

it('has no lock for the state itself, and says when a parent holds the lock', async () => {
  expect(setup([], { hasLock: true }).queryByRole('button', { name: 'Lock' })).toBeNull();
  cleanup();

  const view = setup(['outer', 'inner'], { hasLock: true });
  await setPathLock(['outer'], true);
  flush();
  expect(view.getByText('Ancestor locked')).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Lock' })).toBeNull();
});

it('cannot lock the items of a set or a value that holds a function, but the set itself', () => {
  expect(setup(['flags', 1], { hasLock: true }).lock().disabled).toBe(true);
  cleanup();
  expect(setup(['tool'], { hasLock: true }).lock().disabled).toBe(true);
  cleanup();
  expect(setup(['flags'], { hasLock: true }).lock().disabled).toBe(false);
});
