import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush, untrack } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { getStatePath, setStatePath } from '@/devtools-panel/store/state-location';
import { isPinned, setSetting, togglePin } from '@/devtools-panel/store/store';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { setHiddenTypes } from '../../store-helpers/view-prefs';
import {
  NavigatorInfoContext,
  type NavigatorInfo,
  type PublishNavigatorInfo,
} from '../navigator-info';
import { TilesNav } from './TilesNav';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

// What the tiles tell the breadcrumbs and the toolbar, as StateView receives it
const [getInfo, setInfo] = createSignal<NavigatorInfo>();
const publish: PublishNavigatorInfo = (info) => {
  setInfo(info);
  return () => setInfo(undefined);
};

// jsdom has no layout, so no scrolling either
Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
  if (isPinned(['stats'])) togglePin(['stats']);
  setSetting('state.filters', []);
  setStatePath([]);
  flush();
});

function setup(initialPath: Path = []) {
  const game = createGame({
    hp: 10,
    stats: { str: 1, nested: { a: 1 }, name: 'x' },
    inv: [1, 2],
    empty: {},
  });
  startGameState(game.state());
  applyUpdate(game.update());
  // Starts from the state itself: a selection of its own tile has no view to stay in
  setStatePath(['hp']);
  flush();
  setStatePath(initialPath);
  flush();

  const onSelect = vi.fn((path: Path) => {
    setStatePath(path);
    flush();
  });
  const view = render(() => (
    <NavigatorInfoContext value={publish}>
      <TilesNav path={getStatePath()} onSelect={onSelect} />
    </NavigatorInfoContext>
  ));
  const tiles = () => [...view.container.querySelectorAll<HTMLElement>('[role="option"]')];
  const nameOf = (item: HTMLElement) => item.children[item.children.length - 2]!.textContent;
  const tile = (name: string) => tiles().find((item) => nameOf(item) === name)!;
  const names = () => tiles().map(nameOf);
  const captions = () => tiles().map((item) => item.lastElementChild!.textContent);
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  return { ...view, tiles, tile, names, captions, onSelect, play };
}

it('shows the values of the state as tiles, with what they hold or what they are', () => {
  const { names, captions } = setup();
  // The order of the sort by type: containers first. The state itself has no tile to go up
  expect(names()).toEqual(['empty', 'stats', 'inv', 'hp']);
  expect(captions()).toEqual(['0 entries', '3 entries', '2 items', '10']);
});

it('selects a value with a click, and opens a container with a click', () => {
  const { tile, names, captions, onSelect } = setup();
  tile('hp').click();
  expect(onSelect).toHaveBeenCalledWith(['hp']);
  expect(tile('hp').getAttribute('aria-selected')).toBe('true');

  tile('stats').click();
  flush();
  // The tile that goes up comes first, and the container itself is the selection
  expect(names()).toEqual(['State', 'nested', 'str', 'name']);
  expect(captions()).toEqual(['go up', '1 entry', '1', '"x"']);
  expect(getStatePath()).toEqual(['stats']);
});

it('goes up with the tile that goes up, and selects the container that it came from', () => {
  const { tile, names } = setup(['stats', 'nested']);
  expect(names()).toEqual(['stats', 'a']);

  tile('stats').click();
  flush();
  expect(names()).toEqual(['State', 'nested', 'str', 'name']);
  expect(getStatePath()).toEqual(['stats', 'nested']);
  expect(tile('nested').getAttribute('aria-selected')).toBe('true');
});

it('selects the container that the tiles show with a click between the tiles', () => {
  const { getByRole, onSelect } = setup(['stats', 'str']);
  getByRole('listbox').click();
  expect(onSelect).toHaveBeenCalledWith(['stats']);
});

it('follows a selection that is made elsewhere', () => {
  const { names } = setup(['inv', 0]);
  expect(names()).toEqual(['State', '0', '1']);
  setStatePath(['stats', 'nested', 'a']);
  flush();
  expect(names()).toEqual(['stats', 'a']);
});

it('marks a pinned tile, and a tile that holds a changed value, containers too', () => {
  togglePin(['stats']);
  flush();
  const { tile, tiles, play } = setup();
  // Pinned first, with its mark
  expect(tiles()[0]).toBe(tile('stats'));
  expect(tile('stats').querySelector('[aria-label="Pinned"]')).not.toBeNull();
  // On the icon, and without the frame that a pinned tile used to have
  expect(tile('stats').children[0]!.querySelector('[aria-label="Pinned"]')).not.toBeNull();
  expect(tile('stats').className).not.toContain('yellow');
  expect(tile('hp').querySelector('[aria-label="Pinned"]')).toBeNull();
  togglePin(['stats']);
  flush();

  play((live) => (live.stats.nested.a = 5));
  expect(tile('stats').querySelector('[aria-label="Changed recently"]')).not.toBeNull();
  expect(tile('hp').querySelector('[aria-label="Changed recently"]')).toBeNull();
});

it('tells the breadcrumbs which container it shows, and the toolbar the types in it', () => {
  const { tile, unmount } = setup(['hp']);
  const info = () => untrack(() => getInfo()!);
  expect(info().getBreadcrumbsPath()).toEqual([]);
  expect(info().getAvailableTypes()).toEqual(['object', 'array', 'number']);

  tile('stats').click();
  flush();
  expect(info().getBreadcrumbsPath()).toEqual(['stats']);
  expect(info().getAvailableTypes()).toEqual(['object', 'number', 'string']);

  unmount();
  flush();
  expect(untrack(getInfo)).toBeUndefined();
});

describe('the filter of types', () => {
  it('leaves out the hidden values, and says so in the count of a container', () => {
    setHiddenTypes(['number']);
    flush();
    const { names, tile } = setup();
    expect(names()).toEqual(['empty', 'stats', 'inv']);
    const count = tile('stats').lastElementChild!.querySelector('span')!;
    expect(count.textContent).toBe('2 entries');
    expect(count.className).toContain('text-amber-400');
    expect(count.title).toBe('Contains 2 values (1 hidden)');
  });
});
