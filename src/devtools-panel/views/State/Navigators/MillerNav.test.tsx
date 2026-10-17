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
