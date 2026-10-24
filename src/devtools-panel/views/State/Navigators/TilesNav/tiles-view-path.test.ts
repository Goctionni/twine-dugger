import { describe, expect, it } from 'vite-plus/test';

import type { JSONSafeContainer } from '@/shared/shared-types';

import { resolveTilesViewPath } from './tiles-view-path';

const state = { hp: 1, stats: { str: 1, deep: { x: 1 } }, inv: [1, 2] } as JSONSafeContainer;

describe('resolveTilesViewPath', () => {
  it('opens a selected container, and shows a selected value among its siblings', () => {
    expect(resolveTilesViewPath(state, ['stats'], undefined)).toEqual(['stats']);
    expect(resolveTilesViewPath(state, ['stats', 'str'], undefined)).toEqual(['stats']);
    expect(resolveTilesViewPath(state, ['hp'], undefined)).toEqual([]);
    expect(resolveTilesViewPath(state, [], undefined)).toEqual([]);
  });

  it('stays while the selection is the view, one of its tiles, or the tile that goes up', () => {
    const view = ['stats'];
    expect(resolveTilesViewPath(state, ['stats'], view)).toEqual(view);
    expect(resolveTilesViewPath(state, ['stats', 'deep'], view)).toEqual(view);
    expect(resolveTilesViewPath(state, ['stats', 'str'], view)).toEqual(view);
    expect(resolveTilesViewPath(state, [], view)).toEqual(view);
  });

  it('follows a selection that is somewhere else', () => {
    const view = ['stats'];
    expect(resolveTilesViewPath(state, ['stats', 'deep', 'x'], view)).toEqual(['stats', 'deep']);
    expect(resolveTilesViewPath(state, ['inv'], view)).toEqual(['inv']);
    expect(resolveTilesViewPath(state, ['hp'], view)).toEqual([]);
  });

  it('has no tile to go up from the state itself', () => {
    expect(resolveTilesViewPath(state, ['hp'], [])).toEqual([]);
    expect(resolveTilesViewPath(state, ['stats', 'deep'], [])).toEqual(['stats', 'deep']);
  });

  it('does not keep a view that is gone or is no longer a container', () => {
    expect(resolveTilesViewPath(state, ['hp'], ['gone'])).toEqual([]);
    expect(resolveTilesViewPath(state, ['hp'], ['hp'])).toEqual([]);
  });
});
