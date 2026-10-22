import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { showAddDialog } from './AddPropertyDialog';
import { ContainerEditor } from './ContainerEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
}));

vi.mock('./AddPropertyDialog', () => ({ showAddDialog: vi.fn() }));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setState).mockClear();
  vi.mocked(showAddDialog).mockClear();
});

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

it('has buttons to add and to edit as JSON, which does nothing yet', () => {
  const view = setup(['group']);
  expect(view.getByRole('button', { name: 'Add property' })).toBeTruthy();
  expect(view.getByRole<HTMLButtonElement>('button', { name: 'Edit as JSON' }).disabled).toBe(true);
});

it('says item for an array, property for a map, and adds nothing to a set', () => {
  expect(setup(['list']).getByRole('button', { name: 'Add item' })).toBeTruthy();
  cleanup();
  expect(setup(['map']).getByRole('button', { name: 'Add property' })).toBeTruthy();
  cleanup();
  expect(setup(['flags']).queryByRole('button', { name: /Add/ })).toBeNull();
});

it('writes what the dialog gives, at the name, or at the end of an array', async () => {
  vi.mocked(showAddDialog).mockResolvedValueOnce({ name: 'd', value: 4 });
  const group = setup(['group']);
  group.getByRole('button', { name: 'Add property' }).click();
  await vi.waitFor(() => expect(setState).toHaveBeenCalledWith(['group', 'd'], 4));
  expect(showAddDialog).toHaveBeenLastCalledWith({
    target: 'object',
    existingKeys: ['a', 'b', 'c'],
    defaultType: 'number',
  });
  cleanup();

  vi.mocked(showAddDialog).mockResolvedValueOnce({ value: 'x' });
  const list = setup(['list']);
  list.getByRole('button', { name: 'Add item' }).click();
  await vi.waitFor(() => expect(setState).toHaveBeenCalledWith(['list', 2], 'x'));
  cleanup();

  vi.mocked(showAddDialog).mockResolvedValueOnce({ name: 'k2', value: 1 });
  setup(['map']).getByRole('button', { name: 'Add property' }).click();
  await vi.waitFor(() => expect(setState).toHaveBeenCalledWith(['map', 'k2'], 1));
});

it('writes nothing when the dialog is closed, and has no type to start from for mixed children', async () => {
  vi.mocked(showAddDialog).mockResolvedValueOnce(undefined);
  const view = setup([]);
  view.getByRole('button', { name: 'Add property' }).click();
  await vi.waitFor(() => expect(showAddDialog).toHaveBeenCalled());
  expect(setState).not.toHaveBeenCalled();
  expect(vi.mocked(showAddDialog).mock.calls[0]![0].defaultType).toBeUndefined();
});

it('cannot add to a container that is locked', async () => {
  const view = setup(['group']);
  await setPathLock(['group'], true);
  flush();
  expect(view.getByRole<HTMLButtonElement>('button', { name: 'Add property' }).disabled).toBe(true);
});
