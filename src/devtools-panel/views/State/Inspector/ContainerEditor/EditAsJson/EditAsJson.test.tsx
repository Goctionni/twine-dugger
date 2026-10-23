import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { deleteFromState, setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import { SET_MARKER } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { ContainerEditor } from '../ContainerEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
  deleteFromState: vi.fn(async () => {}),
}));

vi.mock('../AddPropertyDialog', () => ({ showAddDialog: vi.fn() }));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setState).mockClear();
  vi.mocked(deleteFromState).mockClear();
});

function setup(path: Path = ['group']) {
  const game = createGame({
    group: { a: 1, b: 'two', c: true, deep: { x: 1 }, tags: ['t'] },
    list: [1, 2, 3],
    mixed: [1, { a: 1 }],
    flags: new Set([1, 2]),
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <ContainerEditor path={path} />);
  const open = () => {
    view.getByRole('button', { name: 'Edit as JSON' }).click();
    flush();
  };
  const area = () => view.getByRole<HTMLTextAreaElement>('textbox', { name: 'JSON' });
  const type = (value: unknown) => {
    area().value = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    area().dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };
  const save = () => view.getByRole<HTMLButtonElement>('button', { name: 'Save changes' });
  const rowBox = (name: string) =>
    view.getByText(name, { selector: 'span.truncate' }).closest('label')!
      .firstElementChild as HTMLInputElement;
  return { ...view, open, area, type, save, rowBox };
}

it('replaces the grid with the JSON of the primitive properties', () => {
  const { open, area, getByText, queryByRole } = setup();
  expect(queryByRole('textbox', { name: 'JSON' })).toBeNull();

  open();
  expect(JSON.parse(area().value)).toEqual({ a: 1, b: 'two', c: true });
  expect(getByText('Editing all properties')).toBeTruthy();
  expect(getByText(/2 container properties excluded/)).toBeTruthy();
  expect(queryByRole('button', { name: 'Edit as JSON' })).toBeNull();
});

it('is about the selected properties when some of them are selected', () => {
  const { rowBox, open, area, getByText, queryByText } = setup();
  rowBox('a').click();
  rowBox('c').click();
  flush();

  open();
  expect(getByText('Editing 2 selected properties')).toBeTruthy();
  expect(JSON.parse(area().value)).toEqual({ a: 1, c: true });
  expect(queryByText(/container properties excluded/)).toBeNull();
});

it('can include the container properties, until something is typed', () => {
  const { open, area, getByRole, type } = setup();
  open();
  const box = () => getByRole<HTMLInputElement>('checkbox', { name: /Include container/ });
  box().click();
  flush();
  expect(Object.keys(JSON.parse(area().value) as object)).toEqual(['a', 'b', 'c', 'deep', 'tags']);

  type({ a: 1 });
  expect(box().disabled).toBe(true);
});

it('saves what changed: sets, adds and deletes, and goes back to the grid', async () => {
  const { open, type, save, getByRole, queryByRole } = setup();
  open();
  type({ a: 2, b: 'two', d: 'new' });
  save().click();

  await vi.waitFor(() => expect(deleteFromState).toHaveBeenCalledWith(['group', 'c']));
  expect(setState).toHaveBeenCalledWith(['group', 'a'], 2);
  expect(setState).toHaveBeenCalledWith(['group', 'd'], 'new');
  expect(setState).toHaveBeenCalledTimes(2);
  await vi.waitFor(() => expect(queryByRole('textbox', { name: 'JSON' })).toBeNull());
  expect(getByRole('button', { name: 'Edit as JSON' })).toBeTruthy();
});

it('cancels without writing', () => {
  const { open, type, getByRole, queryByRole } = setup();
  open();
  type({ a: 5 });
  getByRole('button', { name: 'Cancel' }).click();
  flush();
  expect(setState).not.toHaveBeenCalled();
  expect(queryByRole('textbox', { name: 'JSON' })).toBeNull();
});

it('says when the text is not JSON, or not an object, and does not save', () => {
  const { open, type, save, getByRole } = setup();
  open();
  type('{');
  expect(getByRole('alert').textContent).toBeTruthy();
  expect(save().disabled).toBe(true);

  type('[1]');
  expect(getByRole('alert').textContent).toBe('Expected an object');
});

it('warns about a container property that is not in the edit and would be overwritten', () => {
  const { open, type, getByText } = setup();
  open();
  type({ a: 1, b: 'two', c: true, deep: 5 });
  expect(getByText(/"deep" exists on this object but is not part of this edit/)).toBeTruthy();
});

it('makes it an error to change a value that is locked, and only then', async () => {
  const { open, type, save, getByRole, queryByRole } = setup();
  await setPathLock(['group', 'b'], true);
  flush();
  open();

  type({ a: 2, b: 'two', c: true });
  expect(queryByRole('alert')).toBeNull();
  expect(save().disabled).toBe(false);

  type({ a: 1, b: 'changed', c: true });
  expect(getByRole('alert').textContent).toBe('b is locked, and cannot be changed');
  expect(save().disabled).toBe(true);

  type({ a: 1, c: true });
  expect(getByRole('alert').textContent).toBe('b is locked, and cannot be changed');
});

it('lists the changes on request, with the type changes', () => {
  const { open, type, getByRole, getByText } = setup();
  open();
  type({ a: 'text', b: 'two', d: 1 });
  getByRole('checkbox', { name: 'Show list of changes' }).click();
  flush();

  expect(getByText(/a 1 → "text"/)).toBeTruthy();
  expect(getByText('(number → string)')).toBeTruthy();
  expect(getByText('add', { selector: '.text-green-400' })).toBeTruthy();
  expect(getByText('delete', { selector: '.text-red-400' })).toBeTruthy();
});

it('edits an array by position, writing the new items and deleting from the end', async () => {
  const { open, type, save, area } = setup(['list']);
  open();
  expect(JSON.parse(area().value)).toEqual([1, 2, 3]);
  type([9]);
  save().click();

  await vi.waitFor(() => expect(deleteFromState).toHaveBeenCalledTimes(2));
  expect(setState).toHaveBeenCalledWith(['list', 0], 9);
  expect(vi.mocked(deleteFromState).mock.calls.map(([path]) => path)).toEqual([
    ['list', 2],
    ['list', 1],
  ]);
});

it('writes a set as a whole, with its marker', async () => {
  const { open, type, save, getByText } = setup(['flags']);
  open();
  expect(getByText(/the set is shown as an array/)).toBeTruthy();
  type([1, 2, 3]);
  save().click();

  await vi.waitFor(() => expect(setState).toHaveBeenCalledWith(['flags'], [SET_MARKER, 1, 2, 3]));
});

it('is not for an array that holds containers', () => {
  const { getByRole } = setup(['mixed']);
  const button = getByRole<HTMLButtonElement>('button', { name: 'Edit as JSON' });
  expect(button.disabled).toBe(true);
  expect(button.title).toBe('Only available when all items are primitive values');
});

it('indents with Tab', () => {
  const { open, area } = setup();
  open();
  area().setSelectionRange(0, 0);
  area().dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
  );
  flush();
  expect(area().value.startsWith('  {')).toBe(true);
});

it('indents the selected lines with Tab, and takes it back with Shift+Tab', () => {
  const { open, type, area } = setup();
  open();
  type('one\ntwo\nthree');
  const press = (shiftKey: boolean) => {
    area().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }),
    );
    flush();
  };

  area().setSelectionRange(2, 10);
  press(false);
  expect(area().value).toBe('  one\n  two\n  three');

  area().setSelectionRange(0, area().value.length);
  press(true);
  expect(area().value).toBe('one\ntwo\nthree');

  // One line: the caret moves with the removed spaces
  type('  one');
  area().setSelectionRange(4, 4);
  press(true);
  expect(area().value).toBe('one');
  expect(area().selectionStart).toBe(2);
});

it('starts with the grid again when another container is selected', () => {
  const game = createGame({ one: { a: 1 }, two: { b: 2 } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(['one']);
  const view = render(() => <ContainerEditor path={getPath()} />);
  view.getByRole('button', { name: 'Edit as JSON' }).click();
  flush();
  expect(view.getByRole('textbox', { name: 'JSON' })).toBeTruthy();

  setPath(['two']);
  flush();
  expect(view.queryByRole('textbox', { name: 'JSON' })).toBeNull();
  expect(view.getByRole('button', { name: 'Edit as JSON' })).toBeTruthy();
});
