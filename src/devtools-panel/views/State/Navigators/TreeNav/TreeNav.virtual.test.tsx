import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { requestScrollTo } from '@/devtools-panel/store/state-location';
import { setSetting } from '@/devtools-panel/store/store';
import type { Path } from '@/shared/shared-types';
import { stubVirtualLayout } from '@/testing/stub-virtual-layout';
import { createGame } from '@/testing/test-game';

import { TreeNav } from './TreeNav';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

Element.prototype.scrollIntoView = vi.fn();

// A window of three rows
let layout: ReturnType<typeof stubVirtualLayout>;
beforeEach(() => {
  layout = stubVirtualLayout({ viewportHeight: 90, itemHeight: 30 });
});
afterEach(() => {
  cleanup();
  layout.restore();
});

const KEYS = Array.from({ length: 200 }, (_, index) => `k${String(index).padStart(3, '0')}`);

function setup(initialPath: Path = []) {
  const game = createGame({
    big: { nested: { a: 1 }, ...Object.fromEntries(KEYS.map((key, index) => [key, index])) },
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(initialPath);
  const view = render(() => (
    <div style={{ 'overflow-y': 'auto' }}>
      <TreeNav path={getPath()} onSelect={setPath} />
    </div>
  ));
  const rows = () => [...view.container.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  const names = () => rows().map((row) => row.querySelector('span.shrink-0.truncate')!.textContent);
  return { ...view, rows, names, setPath };
}

it('keeps only the rows near the window in the DOM, in a list as tall as all of them', () => {
  const { names, container } = setup(['big', 'k000']);
  // big, nested, and 200 values: all open, a window of three rows and some more around it
  expect(names().length).toBeLessThan(25);
  expect(names().slice(0, 3)).toEqual(['big', 'nested', 'k000']);

  const list = container.querySelector<HTMLElement>('[role="tree"] > .relative')!;
  expect(list.style.height).toBe(`${202 * 30}px`);
});

it('keeps the selected row in the DOM when it is far from the window, and names it the active one', () => {
  const { rows, getByRole } = setup(['big', 'k150']);
  const selected = rows().find((row) => row.getAttribute('aria-selected') === 'true');
  expect(selected?.textContent).toContain('k150');
  expect(getByRole('tree').getAttribute('aria-activedescendant')).toBe(selected!.id);
  expect(rows().length).toBeLessThan(25);
});

it('scrolls to the selected row when a scroll to it is asked for, also when it is shown a moment later', () => {
  const { setPath } = setup();
  layout.scrollTo.mockClear();

  // The parent is opened after the path is set: the scroll waits for the row
  setPath(['big', 'k150']);
  requestScrollTo();
  flush();
  expect(layout.scrollTo).toHaveBeenCalledTimes(1);
  // 152 rows of 30 before it
  expect(layout.scrollTo.mock.calls[0]![0].top).toBeGreaterThan(4000);

  // Opening and closing is no reason to scroll
  flush();
  expect(layout.scrollTo).toHaveBeenCalledTimes(1);
});

describe('the list beside the tree', () => {
  beforeEach(() => setSetting('state.treeLayout', 'primitives-in-list'));
  afterEach(() => setSetting('state.treeLayout', 'containers-and-primitives'));

  const values = (container: HTMLElement) => [
    ...container.querySelectorAll<HTMLElement>('[role="group"] [role="treeitem"]'),
  ];

  it('keeps only the values near the window in the DOM, in a list as tall as all of them', () => {
    const { container } = setup(['big']);
    expect(values(container).length).toBeLessThan(25);
    expect(values(container)[0]!.textContent).toContain('k000');
    expect(container.querySelector<HTMLElement>('[role="group"] .relative')!.style.height).toBe(
      `${200 * 30}px`,
    );
  });

  it('keeps the selected value in the DOM when it is far from the window, and names it the active one', () => {
    const { container, getByRole } = setup(['big', 'k150']);
    const selected = values(container).find((row) => row.getAttribute('aria-selected') === 'true');
    expect(selected?.textContent).toContain('k150');
    expect(getByRole('tree').getAttribute('aria-activedescendant')).toBe(selected!.id);
    expect(values(container).length).toBeLessThan(25);
  });

  it('scrolls to the selected value when a scroll to it is asked for', () => {
    const { setPath } = setup(['big']);
    layout.scrollTo.mockClear();

    setPath(['big', 'k150']);
    requestScrollTo();
    flush();
    expect(layout.scrollTo).toHaveBeenCalledTimes(1);
    // 150 values of 30 before it
    expect(layout.scrollTo.mock.calls[0]![0].top).toBeGreaterThan(4000);
  });
});
