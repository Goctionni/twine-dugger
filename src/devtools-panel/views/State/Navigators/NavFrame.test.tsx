import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { getRevealCount } from '@/devtools-panel/store/state-location';
import { createGame } from '@/devtools-panel/store/test-game';

import { NavFrame } from './NavFrame';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

afterEach(cleanup);

it('selects the crumb that is clicked and asks for the selection to be revealed', () => {
  const game = createGame({ stats: { str: 1 } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const onSelect = vi.fn();
  const { getByText } = render(() => (
    <NavFrame
      path={['stats', 'str']}
      selectionKind="primitive"
      onSelect={onSelect}
      isOverlayOpen={false}
      onCloseOverlay={() => {}}
    >
      <div />
    </NavFrame>
  ));
  const before = getRevealCount();

  getByText('stats').click();
  flush();

  expect(onSelect).toHaveBeenCalledWith(['stats']);
  expect(getRevealCount()).toBe(before + 1);
});
