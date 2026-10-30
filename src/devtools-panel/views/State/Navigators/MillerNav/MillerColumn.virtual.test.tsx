import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { startGameState } from '@/devtools-panel/store/game-state';
import { showInStateView } from '@/devtools-panel/store/state-location';
import type { Path } from '@/shared/shared-types';
import { stubVirtualLayout } from '@/testing/stub-virtual-layout';
import { createGame } from '@/testing/test-game';

import { MillerColumn } from './MillerColumn';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

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

function setup(initialPath: Path = [], depth = 0) {
  const game = createGame({ big: Object.fromEntries(KEYS.map((key, index) => [key, index])) });
  startGameState(game.state());
  flush();

  const [getPath, setPath] = createSignal<Path>(initialPath);
  const onSelect = vi.fn();
  const view = render(() => (
    <div style={{ 'overflow-y': 'auto' }}>
      <MillerColumn
        treeId="tree"
        depth={depth}
        path={getPath()}
        trail={getPath()}
        onSelect={onSelect}
      />
    </div>
  ));
  const rows = () => [...view.container.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  return { ...view, rows, setPath, onSelect };
}

// What was scrolled to on purpose (the virtualizer also puts the scroll area at its start when it begins)
const scrolledTo = () =>
  layout.scrollTo.mock.calls
    .filter(([options]) => options.behavior === 'auto')
    .map(([options]) => options.top!);

describe('a long column', () => {
  it('keeps only the rows near the window in the DOM, in a list as tall as all of them', () => {
    const { rows, container } = setup(['big'], 1);
    // The column of the keys of big
    expect(rows().length).toBeLessThan(25);
    expect(rows()[0]!.textContent).toContain('k000');
    expect(container.querySelector<HTMLElement>('.relative')!.style.height).toBe(`${200 * 30}px`);
  });

  it('keeps the row on the path in the DOM when it is far from the window', () => {
    const { rows } = setup(['big', 'k150'], 1);
    const selected = rows().find((row) => row.dataset.selectionState === 'selected');
    expect(selected?.textContent).toContain('k150');
    expect(rows().length).toBeLessThan(25);
  });
});

describe('scrolling to the selection', () => {
  it('scrolls to the selected row when the column is made', () => {
    setup(['big', 'k150'], 1);
    // 150 rows of 30 before it
    expect(scrolledTo()).toHaveLength(1);
    expect(scrolledTo()[0]).toBeGreaterThan(4000);
  });

  it('stays where it is for a row that is in view, and does nothing in a column without one', () => {
    // Scrolled to where it already is
    setup(['big', 'k001'], 1);
    expect(scrolledTo()).toEqual([0]);
    cleanup();
    layout.scrollTo.mockClear();

    // A column that the path does not go through
    setup(['big'], 1);
    expect(scrolledTo()).toEqual([]);
  });

  it('scrolls again when something outside asks, also for the path that is selected already', () => {
    setup(['big', 'k150'], 1);
    layout.scrollTo.mockClear();

    showInStateView(['big', 'k150']);
    flush();
    expect(scrolledTo()).toHaveLength(1);
  });

  it('does not scroll for a click in the column', () => {
    const { rows } = setup(['big', 'k150'], 1);
    layout.scrollTo.mockClear();

    rows()[0]!.click();
    flush();
    expect(scrolledTo()).toEqual([]);
  });
});
