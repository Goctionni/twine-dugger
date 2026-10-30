import { describe, expect, it } from 'vite-plus/test';

import type { JSONSafeContainer } from '@/shared/shared-types';

import { resolveTilesContainerPath } from './tiles-container-path';

const state = { hp: 1, stats: { str: 1, deep: { x: 1 } }, inv: [1, 2] } as JSONSafeContainer;

describe('resolveTilesContainerPath', () => {
  it('opens a selected container, and shows a selected value among its siblings', () => {
    expect(resolveTilesContainerPath(state, ['stats'], undefined)).toEqual(['stats']);
    expect(resolveTilesContainerPath(state, ['stats', 'str'], undefined)).toEqual(['stats']);
    expect(resolveTilesContainerPath(state, ['hp'], undefined)).toEqual([]);
    expect(resolveTilesContainerPath(state, [], undefined)).toEqual([]);
  });

  it('stays while the selection is the view, one of its tiles, or the tile that goes up', () => {
    const view = ['stats'];
    expect(resolveTilesContainerPath(state, ['stats'], view)).toEqual(view);
    expect(resolveTilesContainerPath(state, ['stats', 'deep'], view)).toEqual(view);
    expect(resolveTilesContainerPath(state, ['stats', 'str'], view)).toEqual(view);
    expect(resolveTilesContainerPath(state, [], view)).toEqual(view);
  });

  it('follows a selection that is somewhere else', () => {
    const view = ['stats'];
    expect(resolveTilesContainerPath(state, ['stats', 'deep', 'x'], view)).toEqual([
      'stats',
      'deep',
    ]);
    expect(resolveTilesContainerPath(state, ['inv'], view)).toEqual(['inv']);
    expect(resolveTilesContainerPath(state, ['hp'], view)).toEqual([]);
  });

  it('has no tile to go up from the state itself', () => {
    expect(resolveTilesContainerPath(state, ['hp'], [])).toEqual([]);
    expect(resolveTilesContainerPath(state, ['stats', 'deep'], [])).toEqual(['stats', 'deep']);
  });

  it('does not keep a view that is gone or is no longer a container', () => {
    expect(resolveTilesContainerPath(state, ['hp'], ['gone'])).toEqual([]);
    expect(resolveTilesContainerPath(state, ['hp'], ['hp'])).toEqual([]);
  });
});
