import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setStateMulti } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import {
  MARKED_VALUE_WRITE_ERROR,
  NAN_MARKER,
  SET_MARKER,
  UNDEFINED_MARKER,
} from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

import { ContainerEditor } from '../ContainerEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setStateMulti: vi.fn(async () => []),
}));

vi.mock('../AddPropertyDialog', () => ({ showAddDialog: vi.fn() }));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setStateMulti).mockClear();
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
  const { open, area, getByRole, queryByText, type } = setup();
  open();
  const box = () => getByRole<HTMLInputElement>('checkbox', { name: /Include container/ });
  box().click();
  flush();
  expect(Object.keys(JSON.parse(area().value) as object)).toEqual(['a', 'b', 'c', 'deep', 'tags']);
  expect(queryByText(/container properties excluded/)).toBeNull();

  type({ a: 1 });
  expect(box().disabled).toBe(true);
});

it('saves what changed: sets, adds and deletes, and goes back to the grid', async () => {
  const { open, type, save, getByRole, queryByRole } = setup();
  open();
  type({ a: 2, b: 'two', d: 'new' });
  save().click();

  await vi.waitFor(() => expect(setStateMulti).toHaveBeenCalledTimes(1));
  expect(setStateMulti).toHaveBeenCalledWith([
    { path: ['group', 'a'], value: 2, deep: false },
    { path: ['group', 'd'], value: 'new', deep: false },
    { path: ['group', 'c'], delete: true },
  ]);
  await vi.waitFor(() => expect(queryByRole('textbox', { name: 'JSON' })).toBeNull());
  expect(getByRole('button', { name: 'Edit as JSON' })).toBeTruthy();
});

it('cancels without writing, from the top or the bottom', () => {
  const { open, type, getAllByRole, queryByRole } = setup();
  open();
  type({ a: 5 });
  expect(getAllByRole('button', { name: 'Cancel' })).toHaveLength(2);
  getAllByRole('button', { name: 'Cancel' })[0]!.click();
  flush();
  expect(setStateMulti).not.toHaveBeenCalled();
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
  expect(getByRole('alert').textContent).toBe(
    'Locked properties cannot be changed. See list of changes for details',
  );
  expect(save().disabled).toBe(true);

  // A locked property that is left out of the text is not deleted: it is not in the edit
  type({ a: 1, c: true });
  expect(queryByRole('alert')).toBeNull();
});

it('hides Add property while editing', () => {
  const { open, getByRole, queryByRole } = setup();
  expect(getByRole('button', { name: 'Add property' })).toBeTruthy();
  open();
  expect(queryByRole('button', { name: 'Add property' })).toBeNull();
});

it('leaves the locked properties out of the text when nothing is selected', async () => {
  const { open, area, getByText } = setup();
  await setPathLock(['group', 'b'], true);
  flush();
  open();
  expect(getByText('Editing all unlocked properties')).toBeTruthy();
  expect(JSON.parse(area().value)).toEqual({ a: 1, c: true });
  expect(getByText('1 locked property excluded')).toBeTruthy();
});

it('blocks saving a locked property that is typed back in with another value', async () => {
  const { open, type, save, getByRole } = setup();
  await setPathLock(['group', 'b'], true);
  flush();
  open();

  type({ a: 1, b: 'changed', c: true });
  expect(getByRole('alert').textContent).toBe(
    'Locked properties cannot be changed. See list of changes for details',
  );
  expect(save().disabled).toBe(true);
});

it('cannot be opened while a selected property is locked', async () => {
  const { rowBox, getByRole } = setup();
  await setPathLock(['group', 'b'], true);
  flush();
  rowBox('a').click();
  rowBox('b').click();
  flush();

  const button = getByRole<HTMLButtonElement>('button', { name: 'Edit as JSON' });
  expect(button.disabled).toBe(true);
  expect(button.title).toBe('Some of the selected properties are locked');
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

  await vi.waitFor(() => expect(setStateMulti).toHaveBeenCalledTimes(1));
  expect(setStateMulti).toHaveBeenCalledWith([
    { path: ['list', 0], value: 9, deep: false },
    { path: ['list', 2], delete: true },
    { path: ['list', 1], delete: true },
  ]);
});

it('writes a set as a whole, with its marker', async () => {
  const { open, type, save, getByText } = setup(['flags']);
  open();
  expect(getByText(/the set is shown as an array/)).toBeTruthy();
  type([1, 2, 3]);
  save().click();

  await vi.waitFor(() =>
    expect(setStateMulti).toHaveBeenCalledWith([{ path: ['flags'], value: [SET_MARKER, 1, 2, 3] }]),
  );
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

it('marks the text red while something blocks saving, and shows a warning only without it', async () => {
  const { open, type, area, getByRole, queryByText } = setup();
  await setPathLock(['group', 'b'], true);
  flush();
  open();
  expect(area().getAttribute('aria-invalid')).toBe('false');

  // A property that is not in the edit: a warning
  type({ a: 1, c: true, deep: 5 });
  expect(queryByText(/"deep" exists on this object/)).toBeTruthy();
  expect(area().getAttribute('aria-invalid')).toBe('false');

  // A locked one typed back with another value: the error, and the warning goes
  type({ a: 1, b: 'changed', c: true, deep: 5 });
  expect(getByRole('alert').textContent).toBe(
    'Locked properties cannot be changed. See list of changes for details',
  );
  expect(area().getAttribute('aria-invalid')).toBe('true');
  expect(area().className).toContain('border-red-500!');
  expect(queryByText(/exists on this object/)).toBeNull();
});

it('starts a new line like the line before it, further in after a { or [', () => {
  const { open, type, area } = setup();
  open();
  const pressEnter = (caret: number) => {
    area().setSelectionRange(caret, caret);
    area().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flush();
  };

  type('{\n  "a": 1');
  pressEnter(area().value.length);
  expect(area().value).toBe('{\n  "a": 1\n  ');

  type('{\n  "a": [');
  pressEnter(area().value.length);
  expect(area().value).toBe('{\n  "a": [\n    ');

  type('{}');
  pressEnter(1);
  expect(area().value).toBe('{\n  \n}');
  expect(area().selectionStart).toBe(4);

  type('  ]');
  pressEnter(area().value.length);
  expect(area().value).toBe('  ]\n  ');
});

it('takes a } or ] that starts a line one level back', () => {
  const { open, type, area } = setup();
  open();
  const press = (key: string) => {
    area().setSelectionRange(area().value.length, area().value.length);
    area().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    flush();
  };

  type('{\n  "a": [\n    ');
  press(']');
  expect(area().value).toBe('{\n  "a": [\n  ]');

  type('{\n  ');
  press('}');
  expect(area().value).toBe('{\n}');

  // After other text on the line it is only typed (the browser does that)
  type('{ "a": 1 ');
  press('}');
  expect(area().value).toBe('{ "a": 1 ');
});

it('lists the changes to locked properties first, in red', async () => {
  const { open, type, getByRole, container } = setup();
  await setPathLock(['group', 'b'], true);
  flush();
  open();
  type({ a: 2, b: 'changed', c: true });
  getByRole('checkbox', { name: 'Show list of changes' }).click();
  flush();

  const lines = [...container.querySelectorAll<HTMLElement>('.font-mono.text-gray-400 > div')];
  expect(lines.map((line) => line.textContent)).toEqual(['b "two" → "changed"', 'a 1 → 2']);
  expect(lines[0]!.className).toContain('text-red-400');
  expect(lines[1]!.className).not.toContain('text-red-400');
});

it('does not take NaN, an infinity or undefined from the text, and lets existing ones be', () => {
  const game = createGame({ group: { a: 1, bad: Number.NaN } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  const view = render(() => <ContainerEditor path={['group']} />);
  view.getByRole('button', { name: 'Edit as JSON' }).click();
  flush();
  const area = view.getByRole<HTMLTextAreaElement>('textbox', { name: 'JSON' });
  const type = (value: unknown) => {
    area.value = JSON.stringify(value);
    area.dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };

  type({ a: 2, bad: NAN_MARKER });
  expect(view.queryByRole('alert')).toBeNull();

  type({ a: UNDEFINED_MARKER, bad: NAN_MARKER });
  expect(view.getByRole('alert').textContent).toBe(MARKED_VALUE_WRITE_ERROR);
  expect(area.className).toContain('border-red-500!');
  expect(view.getByRole<HTMLButtonElement>('button', { name: 'Save changes' }).disabled).toBe(true);
});
