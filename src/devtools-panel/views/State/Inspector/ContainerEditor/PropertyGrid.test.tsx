import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { deleteFromState, setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { setSetting, togglePin } from '@/devtools-panel/store/store';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

import { confirmDelete } from '../ValueHeader/confirmDelete';
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
  setState: vi.fn(async () => {}),
  deleteFromState: vi.fn(async () => {}),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setState).mockClear();
  vi.mocked(deleteFromState).mockClear();
  vi.mocked(confirmDelete).mockClear();
  setSetting('state.propertyOrder', 'type');
  flush();
});

function setup(path: Path = ['hero']) {
  const game = createGame({
    hero: {
      name: 'Ada',
      hp: 10,
      alive: true,
      notes: 'a\nb',
      stats: { str: 1 },
      items: [1],
      gold: 5,
    },
    list: [1, 2],
    empty: { deep: { x: 1 } },
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <Grid path={path} />);
  const rows = () =>
    view.queryAllByRole('listitem').filter((row) => row.querySelector('span.truncate'));
  const names = () => rows().map((row) => row.querySelector('span.truncate')!.textContent);
  const rowOf = (name: string) => rows()[names().indexOf(name)] as HTMLElement;
  const type = (field: HTMLInputElement, text: string) => {
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };
  return { ...view, names, rowOf, type };
}

it('lists the primitive properties in the order of the navigator, and says what it leaves out', () => {
  const { names, getByText } = setup();
  expect(names()).toEqual(['alive', 'gold', 'hp', 'name', 'notes']);
  expect(getByText('2 container properties are not shown here.')).toBeTruthy();
});

it('follows the sort, and puts the pinned properties first', () => {
  togglePin(['hero', 'notes']);
  flush();
  const byName = setup();
  expect(byName.names()[0]).toBe('notes');
  cleanup();

  setSetting('state.propertyOrder', 'alphabetic');
  flush();
  expect(setup().names()).toEqual(['notes', 'alive', 'gold', 'hp', 'name']);
  togglePin(['hero', 'notes']);
  flush();
});

it('keeps the items of an array in their order, with their positions as names', () => {
  expect(setup(['list']).names()).toEqual(['0', '1']);
});

it('has a row for each type of value, with its editor', () => {
  const { rowOf, getByRole } = setup();
  expect(rowOf('alive').querySelectorAll('input[type=radio]')).toHaveLength(2);
  expect(getByRole<HTMLInputElement>('spinbutton', { name: 'hp' }).value).toBe('10');
  expect(getByRole<HTMLInputElement>('textbox', { name: 'name' }).value).toBe('Ada');
});

it('selects a row by its name', () => {
  const { rowOf } = setup();
  const checkbox = () => rowOf('hp').querySelector<HTMLInputElement>('input[type=checkbox]')!;
  expect(checkbox().checked).toBe(false);

  rowOf('hp').querySelector<HTMLElement>('label')!.click();
  flush();
  expect(checkbox().checked).toBe(true);
  expect(rowOf('hp').querySelector('label')!.className).toContain('border-sky-500');
  expect(rowOf('gold').querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(
    false,
  );

  rowOf('hp').querySelector<HTMLElement>('label')!.click();
  flush();
  expect(checkbox().checked).toBe(false);
});

it('counts what is typed and not saved, and saves it all or drops it', async () => {
  const { getByRole, getByText, queryByText, type } = setup();
  expect(queryByText(/unsaved/)).toBeNull();

  type(getByRole<HTMLInputElement>('spinbutton', { name: 'hp' }), '12');
  expect(getByText('1 unsaved change')).toBeTruthy();
  type(getByRole<HTMLInputElement>('textbox', { name: 'name' }), 'Bo');
  expect(getByText('2 unsaved changes')).toBeTruthy();

  getByText('Save all').click();
  await Promise.resolve();
  expect(setState).toHaveBeenCalledWith(['hero', 'hp'], 12);
  expect(setState).toHaveBeenCalledWith(['hero', 'name'], 'Bo');

  getByText('Discard').click();
  flush();
  expect(queryByText(/unsaved/)).toBeNull();
  expect(getByRole<HTMLInputElement>('spinbutton', { name: 'hp' }).value).toBe('10');
  expect(getByRole<HTMLInputElement>('textbox', { name: 'name' }).value).toBe('Ada');
});

it('does not count what is typed in another container', () => {
  const { getByRole, queryByText, type } = setup(['hero']);
  type(getByRole<HTMLInputElement>('spinbutton', { name: 'hp' }), '12');
  cleanup();

  const other = setup(['list']);
  expect(other.queryByText(/unsaved/)).toBeNull();
  expect(queryByText(/unsaved/)).toBeNull();
});

it('deletes a property once it is confirmed', async () => {
  const { rowOf } = setup();
  rowOf('gold').querySelector<HTMLButtonElement>('button[aria-label="Delete"]')!.click();
  await Promise.resolve();
  expect(confirmDelete).toHaveBeenLastCalledWith('gold', {
    isArrayItem: false,
    hasContents: false,
  });
  expect(deleteFromState).toHaveBeenCalledWith(['hero', 'gold']);
});

it('cannot delete what is locked', async () => {
  const { rowOf } = setup();
  await setPathLock(['hero', 'gold'], true);
  flush();
  expect(
    rowOf('gold').querySelector<HTMLButtonElement>('button[aria-label="Delete"]')!.disabled,
  ).toBe(true);
  expect(
    rowOf('hp').querySelector<HTMLButtonElement>('button[aria-label="Delete"]')!.disabled,
  ).toBe(false);
});

it('marks the properties that changed lately, next to their names', () => {
  const game = createGame({ hero: { hp: 10, gold: 5 } });
  startGameState(game.state());
  flush();
  const view = render(() => <Grid path={['hero']} />);
  const dotsOf = (name: string) =>
    view
      .queryAllByRole('listitem')
      .filter((row) => row.querySelector('span.truncate'))
      .find((row) => row.textContent?.includes(name))!
      .querySelectorAll('[aria-label="Changed recently"]').length;
  expect(dotsOf('hp')).toBe(0);

  game.live.hero.hp = 9;
  applyUpdate(game.update());
  flush();
  expect(dotsOf('hp')).toBe(1);
  expect(dotsOf('gold')).toBe(0);
});

it('says when there is nothing to edit', () => {
  const { getByText } = setup(['empty']);
  expect(getByText('No values to edit here.')).toBeTruthy();
  expect(getByText('1 container property is not shown here.')).toBeTruthy();
});
