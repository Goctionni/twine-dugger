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

afterEach(cleanup);

it('shows where the path came from after going up, and forgets it for another branch', () => {
  const game = createGame({ stats: { str: 1, nested: { a: 1 } }, skills: { cook: 1 } });
  startGameState(game.state());
  flush();

  const [getPath, setPath] = createSignal<Path>(['stats', 'nested']);
  const { container } = render(() => (
    <MillerNav
      path={getPath()}
      selectionKind="container"
      onSelect={() => {}}
      isOverlayOpen={false}
      onCloseOverlay={() => {}}
    />
  ));
  const trailRows = () =>
    [...container.querySelectorAll<HTMLElement>('[data-state="trail"]')].map(
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
  const { getByRole } = render(() => (
    <MillerNav
      path={getPath()}
      selectionKind="container"
      onSelect={onSelect}
      isOverlayOpen={false}
      onCloseOverlay={() => {}}
    />
  ));
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
    <MillerNav
      path={['stats']}
      selectionKind="container"
      onSelect={() => {}}
      isOverlayOpen={false}
      onCloseOverlay={() => {}}
    />
  ));
  const tree = getByRole('tree');
  const columns = getAllByRole('group');

  expect(tree.getAttribute('tabindex')).toBe('0');
  expect(columns.every((column) => column.getAttribute('tabindex') === '-1')).toBe(true);

  columns[0]!.focus();
  expect(document.activeElement).toBe(tree);
});
