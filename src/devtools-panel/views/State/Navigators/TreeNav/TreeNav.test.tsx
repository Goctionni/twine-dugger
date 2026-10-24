import { cleanup, render, within } from '@solidjs/testing-library';
import { createSignal, flush, untrack } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { requestScrollTo } from '@/devtools-panel/store/state-location';
import { setSetting } from '@/devtools-panel/store/store';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { setHiddenTypes } from '../../store-helpers/view-prefs';
import {
  NavigatorInfoContext,
  type NavigatorInfo,
  type PublishNavigatorInfo,
} from '../navigator-info';
import { TreeNav } from './TreeNav';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

// What the tree tells the toolbar and the breadcrumbs, as StateView receives it
const [getInfo, setInfo] = createSignal<NavigatorInfo>();
const publish: PublishNavigatorInfo = (info) => {
  setInfo(info);
  return () => setInfo(undefined);
};
const getTreeTypes = () => untrack(() => getInfo()?.getAvailableTypes());

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
  const view = render(() => (
    <NavigatorInfoContext value={publish}>
      <TreeNav path={getPath()} onSelect={onSelect} />
    </NavigatorInfoContext>
  ));
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
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  return { ...view, rows, names, row, caret, tree, press, onSelect, setPath, getPath, play };
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

it('scrolls the selected row into view when a scroll to it is asked for, also when it is shown a moment later', () => {
  const { setPath } = setup();
  scrollIntoView.mockClear();

  // Its parents are opened after the path is set: the scroll waits for the row
  setPath(['stats', 'nested', 'a']);
  requestScrollTo();
  flush();
  expect(scrollIntoView).toHaveBeenCalledTimes(1);

  // Opening and closing is no reason to scroll
  flush();
  expect(scrollIntoView).toHaveBeenCalledTimes(1);
});

it('tells the toolbar the types of the rows it shows, and nothing when it is not there', () => {
  expect(getTreeTypes()).toBeUndefined();

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
  expect(getTreeTypes()).toBeUndefined();
});

describe('with the values in a list', () => {
  beforeEach(() => setSetting('state.treeLayout', 'primitives-in-list'));
  afterEach(() => setSetting('state.treeLayout', 'containers-and-primitives'));

  const listNames = (view: ReturnType<typeof setup>) =>
    [...view.container.querySelectorAll('[role="group"] [role="treeitem"]')].map(
      (row) => row.querySelector('span.truncate')!.textContent,
    );

  it('has only the containers in the tree, and the values of the selected one in the list', () => {
    const view = setup(['stats']);
    // hp is a value of the state itself: not in the tree
    expect(view.names().filter((name) => !listNames(view).includes(name!))).toEqual([
      'empty',
      'stats',
      'inv',
    ]);
    expect(listNames(view)).toEqual(['str']);
    expect(view.getByRole('group', { name: 'Values' }).textContent).toContain('stats');

    view.setPath([]);
    flush();
    expect(listNames(view)).toEqual(['hp']);
  });

  it('counts only the values that the filter hides in the header of the list', () => {
    const view = setup();
    const header = () => view.getByRole('group', { name: 'Values' }).textContent;

    // inv is an array: hidden from the tree, not from the list
    setHiddenTypes(['array']);
    flush();
    expect(header()).not.toContain('hidden');

    setHiddenTypes(['number']);
    flush();
    expect(header()).toContain('· 1 hidden');
    setHiddenTypes([]);
  });

  it('lists the values of the container that holds a selected value, and marks it quietly', () => {
    const view = setup(['stats', 'str']);
    expect(listNames(view)).toEqual(['str']);
    expect(view.row('stats').dataset.selectionState).toBe('on-path');
    const listed = view.getByRole('group', { name: 'Values' });
    expect(
      within(listed).getByText('str').closest('[role="treeitem"]')!.getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('selects a value of the list that is clicked', () => {
    const view = setup(['stats']);
    view
      .getByRole('group', { name: 'Values' })
      .querySelector<HTMLElement>('[role="treeitem"]')!
      .click();
    flush();
    expect(view.getPath()).toEqual(['stats', 'str']);
  });

  it('has a caret only for a container that holds a container', () => {
    const { caret } = setup();
    expect(caret('stats')).not.toBeNull();
    // inv holds two numbers, which are in the list
    expect(caret('inv')).toBeNull();
    expect(caret('empty')).toBeNull();
  });

  it('tells the toolbar the types of the containers in the tree and of the values in the list', () => {
    const { caret, play, setPath } = setup();
    play((live) => (live.labels = { name: 'x', inner: {} }));
    expect(getTreeTypes()).toEqual(['object', 'array', 'number']);

    // The state's own values are listed: a number. A string in a container that is open is not
    caret('labels')!.click();
    flush();
    expect(getTreeTypes()).toEqual(['object', 'array', 'number']);

    // Select that container: its values, a string, are the ones listed
    setPath(['labels']);
    flush();
    expect(getTreeTypes()).toEqual(['object', 'array', 'string']);
  });

  it('goes into the list with right and back with left, and through it with up and down', () => {
    const { press, getPath, setPath } = setup();
    setPath(['inv']);
    flush();

    // inv holds values only: there is nothing to open, so right goes into the list
    press('ArrowRight');
    expect(getPath()).toEqual(['inv', 0]);
    press('ArrowDown');
    expect(getPath()).toEqual(['inv', 1]);
    press('ArrowDown');
    expect(getPath()).toEqual(['inv', 1]);
    press('ArrowUp');
    expect(getPath()).toEqual(['inv', 0]);
    press('ArrowLeft');
    expect(getPath()).toEqual(['inv']);
  });

  it('opens a container with right first, and goes into the list once it is open', () => {
    const { press, getPath, setPath, names } = setup();
    setPath(['stats']);
    flush();
    expect(names()).not.toContain('nested');

    press('ArrowRight');
    expect(names()).toContain('nested');
    expect(getPath()).toEqual(['stats']);
    press('ArrowRight');
    expect(getPath()).toEqual(['stats', 'str']);
  });
});

it('lists the types of all values in the open containers when the values are in the tree', () => {
  const { caret, play } = setup();
  play((live) => (live.labels = { name: 'x' }));
  expect(getTreeTypes()).toEqual(['object', 'array', 'number']);

  caret('labels')!.click();
  flush();
  expect(getTreeTypes()).toEqual(['object', 'array', 'number', 'string']);
});
