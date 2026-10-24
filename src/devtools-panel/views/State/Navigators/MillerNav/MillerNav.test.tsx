import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { startGameState } from '@/devtools-panel/store/game-state';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { MillerNav } from './MillerNav';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

Element.prototype.scrollIntoView = vi.fn();
// jsdom has no layout: the width of the pane is what a test says (0 is not measured yet)
let paneWidth = 0;
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
);
vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
  () => ({ width: paneWidth }) as DOMRect,
);

afterEach(() => {
  cleanup();
  paneWidth = 0;
});

it('shows where the path came from after going up, and forgets it for another branch', () => {
  const game = createGame({ stats: { str: 1, nested: { a: 1 } }, skills: { cook: 1 } });
  startGameState(game.state());
  flush();

  const [getPath, setPath] = createSignal<Path>(['stats', 'nested']);
  const { container } = render(() => <MillerNav path={getPath()} onSelect={() => {}} />);
  const trailRows = () =>
    [...container.querySelectorAll<HTMLElement>('[data-selection-state="trail"]')].map(
      (row) => row.querySelector('span.shrink-0.truncate')!.textContent,
    );
  const go = (path: Path) => {
    setPath(path);
    flush();
  };

  expect(trailRows()).toEqual([]);

  go(['stats']);
  expect(trailRows()).toEqual(['nested']);

  go([]);
  expect(trailRows()).toEqual(['stats']);

  go(['stats']);
  expect(trailRows()).toEqual(['nested']);

  go(['skills']);
  expect(trailRows()).toEqual([]);
});

it('moves the selection with the arrow keys, and names the selected row as the active one', () => {
  const game = createGame({ stats: { str: 1, nested: { a: 1 } }, skills: { cook: 1 } });
  startGameState(game.state());
  flush();

  const [getPath, setPath] = createSignal<Path>(['skills']);
  let selected: Path = ['skills'];
  const onSelect = vi.fn((path: Path) => {
    selected = path;
    setPath(path);
  });
  const { getByRole } = render(() => <MillerNav path={getPath()} onSelect={onSelect} />);
  const tree = getByRole('tree');
  const press = (key: string, init: KeyboardEventInit = {}) => {
    tree.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
    );
    flush();
  };
  const activeRow = () => document.getElementById(tree.getAttribute('aria-activedescendant')!);
  const activeName = () => activeRow()?.querySelector('span.shrink-0.truncate')?.textContent;

  expect(activeName()).toBe('skills');
  expect(activeRow()?.getAttribute('aria-selected')).toBe('true');

  press('ArrowUp');
  expect(selected).toEqual(['skills']);

  press('ArrowDown');
  expect(selected).toEqual(['stats']);
  expect(activeName()).toBe('stats');

  press('ArrowRight');
  expect(selected).toEqual(['stats', 'nested']);
  press('ArrowRight');
  expect(selected).toEqual(['stats', 'nested', 'a']);
  press('ArrowRight');
  expect(selected).toEqual(['stats', 'nested', 'a']);

  press('ArrowLeft');
  press('ArrowLeft');
  expect(selected).toEqual(['stats']);
  press('ArrowRight');
  expect(selected).toEqual(['stats', 'nested']);

  press('ArrowDown', { ctrlKey: true });
  expect(selected).toEqual(['stats', 'nested']);
});

it('is one Tab stop: the columns are not, and a column that gets the focus passes it on', () => {
  const game = createGame({ stats: { str: 1 }, skills: { cook: 1 } });
  startGameState(game.state());
  flush();

  const { getByRole, getAllByRole } = render(() => (
    <MillerNav path={['stats']} onSelect={() => {}} />
  ));
  const tree = getByRole('tree');
  const columns = getAllByRole('group');

  expect(tree.getAttribute('tabindex')).toBe('0');
  expect(columns.every((column) => column.getAttribute('tabindex') === '-1')).toBe(true);

  columns[0]!.focus();
  expect(document.activeElement).toBe(tree);
});

function renderStrips(path: Path, width: number) {
  const game = createGame({ stats: { str: 1, nested: { a: 1 } }, skills: { cook: 1 } });
  startGameState(game.state());
  flush();

  paneWidth = width;
  const onSelect = vi.fn();
  const view = render(() => <MillerNav path={path} onSelect={onSelect} />);
  const strips = () => [
    ...view.container.querySelectorAll<HTMLElement>('[role="treeitem"][aria-label]'),
  ];
  return { ...view, strips, onSelect };
}

it('collapses the columns that do not fit into strips, from the left', () => {
  // Three columns need 690 px; at 400 px two are strips (2 x 30 + 230 = 290)
  const { strips, getAllByRole, onSelect } = renderStrips(['stats', 'nested'], 400);

  expect(strips().map((strip) => strip.getAttribute('aria-label'))).toEqual(['State', 'stats']);
  expect(strips().map((strip) => strip.title)).toEqual(['State', 'State › stats']);
  expect(getAllByRole('group')).toHaveLength(1);

  strips()[1]!.click();
  expect(onSelect).toHaveBeenCalledWith(['stats']);
  strips()[0]!.click();
  expect(onSelect).toHaveBeenLastCalledWith([]);
});

it('collapses nothing while the columns fit, or before the pane is measured', () => {
  expect(renderStrips(['stats', 'nested'], 700).strips()).toHaveLength(0);
  cleanup();
  expect(renderStrips(['stats', 'nested'], 0).strips()).toHaveLength(0);
});

it('names the strip as the active one when the selected row is in a column that is a strip', () => {
  const { getByRole, strips } = renderStrips(['stats'], 300);

  expect(strips()).toHaveLength(1);
  expect(getByRole('tree').getAttribute('aria-activedescendant')).toBe(strips()[0]!.id);
});

it('selects the row that starts with what is typed, among the rows next to the selected one', () => {
  const game = createGame({ stats: { str: 1 }, skills: { cook: 1 }, hp: 10, gold: 5 });
  startGameState(game.state());
  flush();

  const [getPath, setPath] = createSignal<Path>(['hp']);
  const onSelect = vi.fn((path: Path) => setPath(path));
  const { getByRole } = render(() => <MillerNav path={getPath()} onSelect={onSelect} />);
  getByRole('tree').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'g', bubbles: true, cancelable: true }),
  );
  flush();
  expect(onSelect).toHaveBeenCalledWith(['gold']);
});
