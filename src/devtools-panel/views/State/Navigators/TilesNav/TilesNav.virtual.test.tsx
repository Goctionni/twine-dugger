import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { requestScrollTo } from '@/devtools-panel/store/state-location';
import type { Path } from '@/shared/shared-types';
import { stubVirtualLayout } from '@/testing/stub-virtual-layout';
import { createGame } from '@/testing/test-game';

import { TilesNav } from './TilesNav';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

let layout: ReturnType<typeof stubVirtualLayout>;
afterEach(() => {
  cleanup();
  layout.restore();
});

const KEYS = Array.from({ length: 400 }, (_, index) => `k${String(index).padStart(3, '0')}`);

// A window of two rows of tiles, as wide as four tiles unless a test says otherwise
function setup(initialPath: Path = [], width = 400) {
  layout = stubVirtualLayout({ viewportHeight: 236, itemHeight: 118, width });
  const game = createGame({ big: Object.fromEntries(KEYS.map((key, index) => [key, index])) });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(initialPath);
  const view = render(() => (
    <div style={{ 'overflow-y': 'auto' }}>
      <TilesNav path={getPath()} onSelect={setPath} />
    </div>
  ));
  const tiles = () => [...view.container.querySelectorAll<HTMLElement>('[role="option"]')];
  const rowsOfTiles = () => [...view.container.querySelectorAll<HTMLElement>('[data-index]')];
  return { ...view, tiles, rowsOfTiles, setPath };
}

describe('a long list of tiles', () => {
  it('keeps only the rows near the window in the DOM, in a list as tall as all the rows', () => {
    const { tiles, rowsOfTiles, container } = setup(['big', 'k000']);
    // 400 tiles and the one that goes up: 101 rows of four
    expect(tiles().length).toBeLessThan(60);
    expect(rowsOfTiles()[0]!.children.length).toBe(4);

    const height = parseFloat(
      container.querySelector<HTMLElement>('[role="listbox"] > .relative')!.style.height,
    );
    // 101 rows (118 high where measured, 118.5 estimated) and the 100 spaces between them
    expect(height).toBeGreaterThan(101 * 118 + 100 * 4);
    expect(height).toBeLessThan(101 * 118.5 + 100 * 4 + 1);
  });

  it('puts as many tiles in a row as fit in the width', () => {
    expect(setup(['big', 'k000'], 400).rowsOfTiles()[0]!.children.length).toBe(4);
    cleanup();
    layout.restore();
    expect(setup(['big', 'k000'], 188).rowsOfTiles()[0]!.children.length).toBe(2);
    cleanup();
    layout.restore();
    // Narrower than one tile: one in a row
    expect(setup(['big', 'k000'], 60).rowsOfTiles()[0]!.children.length).toBe(1);
  });

  it('keeps the selected tile in the DOM when it is far from the window, and names it the active one', () => {
    const { tiles, getByRole } = setup(['big', 'k300']);
    const selected = tiles().find((tile) => tile.getAttribute('aria-selected') === 'true');
    expect(selected?.textContent).toContain('k300');
    expect(getByRole('listbox').getAttribute('aria-activedescendant')).toBe(selected!.id);
    expect(tiles().length).toBeLessThan(60);
  });

  it('scrolls to the row of the selected tile when a scroll to it is asked for', () => {
    const { setPath } = setup(['big', 'k000']);
    layout.scrollTo.mockClear();

    setPath(['big', 'k300']);
    requestScrollTo();
    flush();
    const scrolledTo = layout.scrollTo.mock.calls
      .filter(([options]) => options.behavior === 'auto')
      .map(([options]) => options.top!);
    expect(scrolledTo).toHaveLength(1);
    // Row 75 of 118 and a gap of 4
    expect(scrolledTo[0]).toBeGreaterThan(8000);
  });
});
