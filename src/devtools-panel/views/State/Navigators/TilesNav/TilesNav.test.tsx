import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush, untrack } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { getStatePath, setStatePath } from '@/devtools-panel/store/state-location';
import { isPinned, setSetting, togglePin } from '@/devtools-panel/store/store';
import type { Path } from '@/shared/shared-types';
import { stubVirtualLayout } from '@/testing/stub-virtual-layout';
import { createGame } from '@/testing/test-game';

import { setHiddenTypes } from '../../store-helpers/view-prefs';
import {
  NavigatorInfoContext,
  type NavigatorInfo,
  type PublishNavigatorInfo,
} from '../navigator-info';
import { TypeAheadContext, type TypedText } from '../Shared/TypeAhead/type-ahead-context';
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

// What the tiles tell StateView to show of what is typed
const [getTyped, setTyped] = createSignal<TypedText>();

// jsdom has no layout: a window that holds all the tiles, as wide as four tiles
let layout: ReturnType<typeof stubVirtualLayout>;
beforeEach(() => {
  layout = stubVirtualLayout({ viewportHeight: 5000, itemHeight: 118, width: 400 });
});

afterEach(() => {
  cleanup();
  layout.restore();
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
      <TypeAheadContext value={setTyped}>
        <div style={{ 'overflow-y': 'auto' }}>
          <TilesNav path={getStatePath()} onSelect={onSelect} />
        </div>
      </TypeAheadContext>
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

describe('the keyboard', () => {
  const selectedName = (tiles: HTMLElement[]) => {
    const selected = tiles.find((tile) => tile.getAttribute('aria-selected') === 'true');
    return selected?.children[selected.children.length - 2]?.textContent;
  };

  function press(setupResult: ReturnType<typeof setup>, key: string, init: KeyboardEventInit = {}) {
    setupResult
      .getByRole('listbox')
      .dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
      );
    flush();
  }

  it('is a list that has the focus, and says which tile is active', () => {
    const view = setup(['hp']);
    const list = view.getByRole('listbox');
    expect(list.getAttribute('tabindex')).toBe('0');
    expect(list.getAttribute('aria-activedescendant')).toBe(view.tile('hp').id);

    press(view, 'ArrowLeft');
    expect(list.getAttribute('aria-activedescendant')).toBe(view.tile('inv').id);
  });

  it('goes through the tiles with left and right, from the first value when nothing is selected', () => {
    // The container is selected, and has no tile of its own
    const view = setup(['stats']);
    expect(selectedName(view.tiles())).toBeUndefined();

    press(view, 'ArrowRight');
    expect(selectedName(view.tiles())).toBe('nested');
    press(view, 'ArrowRight');
    expect(selectedName(view.tiles())).toBe('str');
    press(view, 'ArrowLeft');
    expect(selectedName(view.tiles())).toBe('nested');
    // The tile that goes up is before the first value
    press(view, 'ArrowLeft');
    expect(selectedName(view.tiles())).toBe('State');
    expect(getStatePath()).toEqual([]);
  });

  it('goes up and down through the rows of tiles', () => {
    // As wide as two tiles
    layout.restore();
    layout = stubVirtualLayout({ viewportHeight: 5000, itemHeight: 118, width: 188 });
    const view = setup(['hp']);
    // empty stats / inv hp
    press(view, 'ArrowUp');
    expect(selectedName(view.tiles())).toBe('stats');
    press(view, 'ArrowDown');
    expect(selectedName(view.tiles())).toBe('hp');
    press(view, 'ArrowDown');
    expect(selectedName(view.tiles())).toBe('hp');
  });

  it('opens the selected container with enter, and goes up with enter on the tile that goes up', () => {
    const view = setup(['stats', 'str']);
    press(view, 'Enter');
    // A value: nothing to open
    expect(view.names()).toEqual(['State', 'nested', 'str', 'name']);

    press(view, 'ArrowLeft');
    expect(selectedName(view.tiles())).toBe('nested');
    press(view, 'Enter');
    expect(view.names()).toEqual(['stats', 'a']);
    expect(getStatePath()).toEqual(['stats', 'nested']);

    press(view, 'ArrowRight');
    expect(selectedName(view.tiles())).toBe('a');
  });

  it('goes up with backspace and with shift and up or left, and selects the container it came from', () => {
    const view = setup(['stats', 'nested']);
    press(view, 'Backspace');
    expect(view.names()).toEqual(['State', 'nested', 'str', 'name']);
    expect(selectedName(view.tiles())).toBe('nested');

    press(view, 'ArrowLeft', { shiftKey: true });
    expect(view.names()).toEqual(['empty', 'stats', 'inv', 'hp']);
    expect(selectedName(view.tiles())).toBe('stats');

    // Nothing is above the state itself
    press(view, 'ArrowUp', { shiftKey: true });
    press(view, 'Backspace');
    expect(view.names()).toEqual(['empty', 'stats', 'inv', 'hp']);
  });

  it('shows the tile that a key selected', () => {
    const view = setup(['stats']);
    layout.scrollTo.mockClear();
    press(view, 'ArrowRight');
    expect(layout.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });
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

describe('type-ahead', () => {
  const selectedName = (view: ReturnType<typeof setup>) => {
    const selected = view.tiles().find((tile) => tile.getAttribute('aria-selected') === 'true');
    return selected?.children[selected.children.length - 2]?.textContent;
  };
  const type = (view: ReturnType<typeof setup>, ...letters: string[]) =>
    letters.forEach((letter) => {
      view
        .getByRole('listbox')
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: letter, bubbles: true, cancelable: true }),
        );
      flush();
    });
  const typed = () => untrack(getTyped);
  const wait = (ms: number) => {
    vi.advanceTimersByTime(ms);
    flush();
  };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('selects the tile that starts with what is typed, and shows what is typed', () => {
    const view = setup(['stats']);
    type(view, 'n');
    expect(selectedName(view)).toBe('nested');
    expect(typed()).toEqual({ text: 'n', isMiss: false });

    type(view, 'a');
    expect(selectedName(view)).toBe('name');
    expect(typed()).toEqual({ text: 'na', isMiss: false });
  });

  it('goes to the next tile with the same letter, and does not select the tile that goes up', () => {
    const view = setup(['stats']);
    type(view, 'n', 'n');
    expect(selectedName(view)).toBe('name');
    type(view, 'n');
    expect(selectedName(view)).toBe('nested');
  });

  it('starts over after a pause, and stops showing what was typed', () => {
    const view = setup(['stats']);
    type(view, 's');
    expect(selectedName(view)).toBe('str');
    wait(600);
    expect(typed()).toBeUndefined();

    // A new search: the next tile with an n after the selected one
    type(view, 'n');
    expect(selectedName(view)).toBe('name');
    expect(typed()).toEqual({ text: 'n', isMiss: false });
  });

  it('shows what is typed twice as long when nothing starts with it', () => {
    const view = setup(['stats']);
    type(view, 'z');
    expect(selectedName(view)).toBeUndefined();
    expect(typed()).toEqual({ text: 'z', isMiss: true });
    wait(600);
    expect(typed()).toEqual({ text: 'z', isMiss: true });
    wait(500);
    expect(typed()).toBeUndefined();
  });

  it('leaves shortcuts, and a space that starts it, alone', () => {
    const view = setup(['stats']);
    const press = (init: KeyboardEventInit) =>
      view
        .getByRole('listbox')
        .dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
    press({ key: 'n', ctrlKey: true });
    press({ key: ' ' });
    expect(typed()).toBeUndefined();
  });

  it('does not show it any more when the tiles are gone', () => {
    const view = setup(['stats']);
    type(view, 'n');
    view.unmount();
    flush();
    expect(typed()).toBeUndefined();
  });
});

describe('the breadcrumbs', () => {
  const selectedName = (view: ReturnType<typeof setup>) => {
    const selected = view.tiles().find((tile) => tile.getAttribute('aria-selected') === 'true');
    return selected?.children[selected.children.length - 2]?.textContent;
  };
  const click = (path: Path) => untrack(() => getInfo()!).onBreadcrumbClick!(path);

  it('goes up to a container above, and selects the container that it came from', () => {
    const view = setup(['stats', 'nested']);
    click(['stats']);
    flush();
    expect(view.names()).toEqual(['State', 'nested', 'str', 'name']);
    expect(selectedName(view)).toBe('nested');

    click([]);
    flush();
    expect(view.names()).toEqual(['empty', 'stats', 'inv', 'hp']);
    expect(selectedName(view)).toBe('stats');
  });

  it('goes up more than one container at once', () => {
    const view = setup(['stats', 'nested']);
    click([]);
    flush();
    expect(view.names()).toEqual(['empty', 'stats', 'inv', 'hp']);
    expect(selectedName(view)).toBe('stats');
    expect(getStatePath()).toEqual(['stats']);
  });

  it('selects what is not above the container that is shown', () => {
    const view = setup(['stats', 'nested']);
    // The container itself
    click(['stats', 'nested']);
    flush();
    expect(getStatePath()).toEqual(['stats', 'nested']);
    expect(view.names()).toEqual(['stats', 'a']);

    // Something next to it, from a menu of the breadcrumbs
    click(['stats', 'str']);
    flush();
    expect(getStatePath()).toEqual(['stats', 'str']);
    expect(view.names()).toEqual(['State', 'nested', 'str', 'name']);
    expect(selectedName(view)).toBe('str');
  });
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
