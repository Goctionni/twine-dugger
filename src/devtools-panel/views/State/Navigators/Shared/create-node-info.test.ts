import { createRoot, flush } from 'solid-js';
import { afterEach, expect, it } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { createGame } from '@/testing/test-game';

import { setSearchText } from '../../state-search';
import { createNodeInfo } from './create-node-info';

afterEach(() => {
  setSearchText('');
  flush();
});

const ranges = (path: Array<string | number>) => {
  const game = createGame({ goldCoins: 'a gold bag', list: ['gold', 5], n: 1250 });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  setSearchText('gold');
  flush();
  return createRoot((dispose) => {
    const info = createNodeInfo(() => path);
    const result = { name: info.getNameRanges(), value: info.getValueRanges() };
    dispose();
    return result;
  });
};

it('marks the match in the name and in the quoted text of a string', () => {
  expect(ranges(['goldCoins'])).toEqual({ name: [[0, 4]], value: [[3, 7]] });
});

it('marks nothing in the index of an item of an array, but in its value', () => {
  expect(ranges(['list', 0])).toEqual({ name: [], value: [[1, 5]] });
});

it('marks nothing without a match, and numbers as they are written', () => {
  expect(ranges(['n'])).toEqual({ name: [], value: [] });
});
