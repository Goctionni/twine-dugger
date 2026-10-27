import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setStateMulti, setStatePropertyLocks } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

import { confirmDeleteMany } from '../ValueHeader/confirmDelete';
import { createSelection } from './createSelection';
import { PropertyGrid } from './PropertyGrid';

function Grid(props: { path: Path }) {
  const selection = createSelection(() => props.path);
  return <PropertyGrid path={props.path} selection={selection} />;
}

vi.mock('../ValueHeader/confirmDelete', () => ({
  confirmDelete: vi.fn(async () => true),
  confirmDeleteMany: vi.fn(async () => true),
}));

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setStateMulti: vi.fn(async () => []),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setStateMulti).mockClear();
  vi.mocked(confirmDeleteMany).mockClear();
  vi.mocked(setStatePropertyLocks).mockClear();
  flush();
});

function setup(path: Path = ['hero']) {
  const game = createGame({
    hero: { name: 'Ada', hp: 10, gold: 5, level: 2, alive: true },
    list: [1, 2, 3],
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <Grid path={path} />);
  const checkbox = (name: string) =>
    view.getByText(name, { selector: 'span.truncate' }).closest('label')!
      .firstElementChild as HTMLInputElement;
  const select = (...names: string[]) => {
    for (const name of names) checkbox(name).click();
    flush();
  };
  const menu = () => view.getByRole<HTMLSelectElement>('combobox', { name: 'Select properties' });
  const choose = (choice: string) => {
    menu().value = choice;
    menu().dispatchEvent(new Event('change', { bubbles: true }));
    flush();
  };
  const selectAll = () => view.getByRole<HTMLInputElement>('checkbox', { name: 'Select all' });
  const bulkValue = () =>
    view.getByRole<HTMLInputElement>('spinbutton', { name: 'Value for the selected' });
  const lockButton = () =>
    view.getByRole<HTMLButtonElement>('button', { name: 'Lock the selected' });
  const type = (field: HTMLInputElement, text: string) => {
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };
  return { ...view, checkbox, select, menu, choose, selectAll, bulkValue, lockButton, type };
}

it('waits for a selection, with nothing to edit', () => {
  const { getByRole, getAllByRole, getByText, lockButton } = setup();
  expect(getByText('Select…')).toBeTruthy();
  const value = getByRole<HTMLInputElement>('textbox', { name: 'Value for the selected' });
  expect(value.disabled).toBe(true);
  expect(value.placeholder).toBe('Select rows to edit them together');
  expect(lockButton().disabled).toBe(true);
  expect(getAllByRole<HTMLButtonElement>('button', { name: 'Delete' })[0]!.disabled).toBe(true);
});

it('selects what is asked for from the menu, and says how many are selected', () => {
  const { choose, checkbox, getByText, selectAll } = setup();

  choose('number');
  expect(getByText('3 selected')).toBeTruthy();
  expect(['hp', 'gold', 'level'].map((name) => checkbox(name).checked)).toEqual([true, true, true]);
  expect(checkbox('name').checked).toBe(false);

  choose('all');
  expect(getByText('5 selected')).toBeTruthy();
  expect(selectAll().checked).toBe(true);

  choose('none');
  expect(getByText('Select…')).toBeTruthy();
});

it('selects all and none with its checkbox, which is half checked for some', () => {
  const { selectAll, select, checkbox } = setup();
  select('hp');
  expect(selectAll().indeterminate).toBe(true);

  selectAll().click();
  flush();
  expect(checkbox('name').checked).toBe(true);
  expect(selectAll().indeterminate).toBe(false);

  selectAll().click();
  flush();
  expect(checkbox('hp').checked).toBe(false);
});

it('starts from the value of the first selected row of the grid, and says when the values are mixed', () => {
  const { select, bulkValue, getByRole } = setup();
  select('gold', 'hp');
  expect(bulkValue().value).toBe('5');

  select('name');
  const mixed = getByRole<HTMLInputElement>('textbox', { name: 'Value for the selected' });
  expect(mixed.value).toBe('Mixed values');
  expect(mixed.readOnly).toBe(true);
});

it('cannot be edited, and says why, while a selected value is locked', async () => {
  const { select, getByRole, queryByRole, lockButton } = setup();
  await setPathLock(['hero', 'level'], true);
  flush();
  select('hp', 'level');

  const message = getByRole<HTMLInputElement>('textbox', { name: 'Value for the selected' });
  expect(message.value).toBe('1 locked');
  expect(message.readOnly).toBe(true);
  expect(message.className).toContain('text-red-400');
  expect(queryByRole('button', { name: 'Save' })).toBeNull();
  // The lock button still works: it is the way out
  expect(lockButton().disabled).toBe(false);
});

it('writes the value to the selected rows', async () => {
  const { select, bulkValue, type, getByRole } = setup();
  select('hp', 'gold');

  type(bulkValue(), '7');
  getByRole('button', { name: 'Save' }).click();
  await Promise.resolve();
  expect(setStateMulti).toHaveBeenCalledTimes(1);
  expect(setStateMulti).toHaveBeenCalledWith([
    { path: ['hero', 'gold'], value: 7 },
    { path: ['hero', 'hp'], value: 7 },
  ]);
});

it('can set all of them to the value that is shown', async () => {
  const { select, bulkValue, type, getByRole } = setup();
  select('hp', 'gold');
  expect(bulkValue().value).toBe('5');

  type(bulkValue(), '5');
  getByRole('button', { name: 'Save' }).click();
  await Promise.resolve();
  expect(setStateMulti).toHaveBeenCalledWith([
    { path: ['hero', 'gold'], value: 5 },
    { path: ['hero', 'hp'], value: 5 },
  ]);
});

it('locks all that are selected, and unlocks them', async () => {
  const { select, lockButton } = setup();
  select('hp', 'gold');
  expect(lockButton().title).toBe('Lock the selected values');

  lockButton().click();
  await Promise.resolve();
  flush();
  expect(getLockedPaths()).toHaveLength(2);
  expect(setStatePropertyLocks).toHaveBeenCalledTimes(1);
  expect(lockButton().title).toBe('Unlock the selected values');

  lockButton().click();
  await Promise.resolve();
  flush();
  expect(getLockedPaths()).toEqual([]);
});

it('says that some are locked already, and locks the others', async () => {
  const { select, lockButton } = setup();
  await setPathLock(['hero', 'hp'], true);
  flush();
  select('hp', 'gold');
  expect(lockButton().title).toBe('Lock All (Some values are already locked)');

  lockButton().click();
  await Promise.resolve();
  flush();
  expect(getLockedPaths()).toHaveLength(2);
});

it('deletes the selected rows after one question, and not the locked ones', async () => {
  const { select, getAllByRole } = setup();
  await setPathLock(['hero', 'level'], true);
  flush();
  select('hp', 'gold', 'level');

  const bulkDelete = getAllByRole<HTMLButtonElement>('button', { name: 'Delete' })[0]!;
  bulkDelete.click();
  await vi.waitFor(() => expect(setStateMulti).toHaveBeenCalledTimes(1));
  expect(confirmDeleteMany).toHaveBeenCalledWith(2);
  expect(setStateMulti).toHaveBeenCalledWith([
    { path: ['hero', 'gold'], delete: true },
    { path: ['hero', 'hp'], delete: true },
  ]);
});

it('deletes the items of an array from the last one', async () => {
  const { getByRole, getAllByRole, selectAll } = setup(['list']);
  selectAll().click();
  flush();
  expect(getByRole<HTMLInputElement>('spinbutton', { name: 'Value for the selected' }).value).toBe(
    '1',
  );

  getAllByRole<HTMLButtonElement>('button', { name: 'Delete' })[0]!.click();
  await vi.waitFor(() => expect(setStateMulti).toHaveBeenCalledTimes(1));
  expect(setStateMulti).toHaveBeenCalledWith([
    { path: ['list', 2], delete: true },
    { path: ['list', 1], delete: true },
    { path: ['list', 0], delete: true },
  ]);
});

it('does not ask when the answer is no', async () => {
  vi.mocked(confirmDeleteMany).mockResolvedValueOnce(false);
  const { select, getAllByRole } = setup();
  select('hp');
  getAllByRole<HTMLButtonElement>('button', { name: 'Delete' })[0]!.click();
  await Promise.resolve();
  await Promise.resolve();
  expect(setStateMulti).not.toHaveBeenCalled();
});

it('keeps what is typed in the number field, and shows the number after Esc and after a save', async () => {
  const { select, bulkValue, type, getByRole } = setup();
  select('hp', 'gold');

  type(bulkValue(), '1.50');
  expect(bulkValue().value).toBe('1.50');

  bulkValue().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  flush();
  expect(bulkValue().value).toBe('5');

  type(bulkValue(), '1.50');
  getByRole('button', { name: 'Save' }).click();
  await Promise.resolve();
  flush();
  expect(bulkValue().value).toBe('1.5');
});
