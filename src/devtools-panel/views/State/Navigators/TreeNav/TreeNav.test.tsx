import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { requestReveal } from '@/devtools-panel/store/state-location';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { TYPE_ORDER } from '../../logic/sort-keys';
import { getTreeTypes } from './tree-types';
import { TreeNav } from './TreeNav';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

// jsdom has no layout, so no scrolling either
const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

afterEach(() => {
  cleanup();
  scrollIntoView.mockClear();
});

function setup(initialPath: Path = []) {
  const game = createGame({
    hp: 10,
    stats: { str: 1, nested: { a: 1 } },
    inv: [1, 2],
    empty: {},
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(initialPath);
  const onSelect = vi.fn((path: Path) => {
    setPath(path);
    flush();
  });
  const view = render(() => <TreeNav path={getPath()} onSelect={onSelect} />);
  const rows = () => [...view.container.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  const names = () => rows().map((row) => row.querySelector('span.shrink-0.truncate')!.textContent);
  const row = (name: string) => rows().find((item) => item.textContent?.includes(name))!;
  const caret = (name: string) =>
    row(name).parentElement!.querySelector<HTMLElement>('[title="Open"], [title="Close"]');
  const tree = () => view.getByRole('tree');
  const press = (key: string) => {
    tree().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    flush();
  };
  return { ...view, rows, names, row, caret, tree, press, onSelect, setPath, getPath };
}

it('shows the values of the state, closed, with their levels', () => {
  const { names, rows } = setup();
  // The order of the sort by type: containers first
  expect(names()).toEqual(['empty', 'stats', 'inv', 'hp']);
  expect(rows().map((row) => row.getAttribute('aria-level'))).toEqual(['1', '1', '1', '1']);
  expect(rows().map((row) => row.getAttribute('aria-expanded'))).toEqual([
    'false',
    'false',
    'false',
    null,
  ]);
});

it('opens a container with its caret without selecting it, and closes it again', () => {
  const { names, caret, onSelect, row } = setup();
  caret('stats')!.click();
  flush();
  expect(names()).toEqual(['empty', 'stats', 'nested', 'str', 'inv', 'hp']);
  expect(row('stats').getAttribute('aria-expanded')).toBe('true');
  expect(onSelect).not.toHaveBeenCalled();

  caret('stats')!.click();
  flush();
  expect(names()).toEqual(['empty', 'stats', 'inv', 'hp']);
});

it('opens a container that is clicked and selects it; a second click closes it', () => {
  const { names, row, onSelect } = setup();
  row('stats').click();
  flush();
  expect(onSelect).toHaveBeenLastCalledWith(['stats']);
  expect(names()).toContain('str');

  row('stats').click();
  flush();
  expect(onSelect).toHaveBeenCalledTimes(2);
  expect(names()).not.toContain('str');
});

it('indents each level and has no caret on a value or an empty container', () => {
  const { caret, row, setPath } = setup();
  caret('stats')!.click();
  flush();

  // The indent is outside of the row that is marked as selected
  expect(row('hp').parentElement!.style.paddingLeft).toBe('6px');
  expect(row('str').parentElement!.style.paddingLeft).toBe('30px');
  expect(row('hp').style.paddingLeft).toBe('');
  expect(caret('hp')).toBeNull();
  expect(caret('empty')).toBeNull();
  expect(caret('stats')?.textContent).toBe('expand_more');
  expect(caret('inv')?.textContent).toBe('chevron_right');
  setPath([]);
});

it('opens the ancestors of the selection, and lets one be closed without moving the selection', () => {
  const { names, caret, onSelect, setPath } = setup();
  setPath(['stats', 'nested', 'a']);
  flush();
  expect(names()).toEqual(['empty', 'stats', 'nested', 'a', 'str', 'inv', 'hp']);

  caret('stats')!.click();
  flush();
  expect(names()).toEqual(['empty', 'stats', 'inv', 'hp']);
  expect(onSelect).not.toHaveBeenCalled();
});

it('marks the selected row only, not the rows on the way to it', () => {
  const { row, setPath } = setup();
  setPath(['stats', 'nested']);
  flush();
  expect(row('stats').dataset.selectionState).toBe('normal');
  expect(row('nested').dataset.selectionState).toBe('selected');
  expect(row('hp').dataset.selectionState).toBe('normal');
});

it('goes through the rows with the arrow keys, opening and closing with left and right', () => {
  const { press, names, getPath } = setup();
  press('ArrowDown');
  expect(getPath()).toEqual(['empty']);
  press('ArrowDown');
  expect(getPath()).toEqual(['stats']);

  // Right opens a closed container, and the next right goes into it
  press('ArrowRight');
  expect(names()).toEqual(['empty', 'stats', 'nested', 'str', 'inv', 'hp']);
  expect(getPath()).toEqual(['stats']);
  press('ArrowRight');
  expect(getPath()).toEqual(['stats', 'nested']);
  press('ArrowDown');
  expect(getPath()).toEqual(['stats', 'str']);

  // Left goes to what holds it, and then closes it
  press('ArrowLeft');
  expect(getPath()).toEqual(['stats']);
  press('ArrowLeft');
  expect(names()).toEqual(['empty', 'stats', 'inv', 'hp']);
  expect(getPath()).toEqual(['stats']);
  press('ArrowUp');
  expect(getPath()).toEqual(['empty']);
});

it('is one stop with the focus, and names the selected row as the active one', () => {
  const { tree, row, setPath } = setup();
  expect(tree().tabIndex).toBe(0);
  expect(tree().getAttribute('aria-activedescendant')).toBeNull();

  setPath(['stats', 'str']);
  flush();
  expect(tree().getAttribute('aria-activedescendant')).toBe(row('str').id);
  expect(row('str').getAttribute('aria-selected')).toBe('true');
});

it('does not scroll for a click, also not when the tree was made with nothing selected', () => {
  const { row } = setup();
  row('stats').click();
  flush();
  expect(scrollIntoView).not.toHaveBeenCalled();
});

it('scrolls the selected row into view when a reveal is asked for, also when it is shown a moment later', () => {
  const { setPath } = setup();
  scrollIntoView.mockClear();

  // Its parents are opened after the path is set: the scroll waits for the row
  setPath(['stats', 'nested', 'a']);
  requestReveal();
  flush();
  expect(scrollIntoView).toHaveBeenCalledTimes(1);

  // Opening and closing is no reason to scroll
  flush();
  expect(scrollIntoView).toHaveBeenCalledTimes(1);
});

it('tells the toolbar the types of the rows it shows, and every type when it is not there', () => {
  expect(getTreeTypes()).toEqual(TYPE_ORDER);

  const { caret, unmount } = setup();
  // The state itself holds objects, an array and a number
  expect(getTreeTypes()).toEqual(['object', 'array', 'number']);

  caret('stats')!.click();
  flush();
  expect(getTreeTypes()).toEqual(['object', 'array', 'number']);
  caret('inv')!.click();
  flush();
  expect(getTreeTypes()).toEqual(['object', 'array', 'number']);

  unmount();
  flush();
  expect(getTreeTypes()).toEqual(TYPE_ORDER);
});
