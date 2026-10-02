import { createRoot, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ParsedPassageData } from '@/shared/shared-types';

import * as gameState from '../../store/game-state';
import * as passageStore from '../../store/passages';
import * as store from '../../store/store';
import { createSearchResults } from './create-searchResults';
import * as utils from './search-utils';
import type * as SearchUtils from './search-utils';

vi.mock('../../api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));
vi.mock('./search-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof SearchUtils>();
  return {
    ...actual,
    findStateMatches: vi.fn(actual.findStateMatches),
    findPassageMatches: vi.fn(actual.findPassageMatches),
  };
});

const passages: ParsedPassageData[] = [
  { id: 1, name: 'Tavern', content: 'A dragon sleeps.', tags: [], size: null, position: null },
  { id: 2, name: 'Cellar', content: 'Rats.', tags: [], size: null, position: null },
];

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, {
    scheduler: {
      postTask: (task: () => unknown) => Promise.resolve().then(task),
      yield: () => Promise.resolve(),
    },
  });
  vi.mocked(utils.findStateMatches).mockClear();
  vi.mocked(utils.findPassageMatches).mockClear();
  gameState.startGameState({ boss: 'dragon', list: ['dragon fly', 'newt'] });
  passageStore.setPassageData(passages);
  store.setNavigationPage('search');
  store.setViewState('search', 'query', '');
  flush();
});
afterEach(() => vi.useRealTimers());

const settle = async (ms = 10) => {
  await vi.advanceTimersByTimeAsync(ms);
  flush();
  await vi.advanceTimersByTimeAsync(0);
};

const setup = () => {
  return createRoot((dispose) => ({ results: createSearchResults(), [Symbol.dispose]: dispose }));
};

const type = async (query: string) => {
  store.setViewState('search', 'query', query);
  flush();
  await settle();
};

describe('createSearchResults', () => {
  it('searches the state and the passages for what is typed', async () => {
    using res = setup();

    await type('dr');
    expect(res.results().state.map((r) => r.path.join('.'))).toEqual(['boss', 'list.0']);
    expect(res.results().passage.map((p) => p.id)).toEqual([1]);

    await type('dragon f');
    expect(res.results().state.map((r) => r.path.join('.'))).toEqual(['list.0']);
    expect(res.results().passage).toEqual([]);
  });

  it('searches again for new diffs, at most once a second', async () => {
    using res = setup();
    await type('dr');
    expect(utils.findStateMatches).toHaveBeenCalledTimes(1);

    const change = (value: string) => {
      gameState.applyUpdate({
        type: 'update',
        passage: 'P',
        delta: { boss: [value === 'dragon' ? 'newt' : 'dragon', value] } as never,
        reverts: [],
      });
      flush();
    };

    change('newt');
    await settle(500);
    change('dragon');
    await settle(499);
    expect(utils.findStateMatches).toHaveBeenCalledTimes(1);
    await settle(1);
    expect(utils.findStateMatches).toHaveBeenCalledTimes(2);
    expect(res.results().state.map((r) => r.path.join('.'))).toEqual(['boss', 'list.0']);
  });

  it('does nothing while another page is open, and clears when the query is', async () => {
    using res = setup();
    store.setNavigationPage('state');
    await type('dr');
    expect(utils.findStateMatches).not.toHaveBeenCalled();

    store.setNavigationPage('search');
    flush();
    await settle();
    expect(res.results().state.length).toBeGreaterThan(0);

    await type('');
    expect(res.results()).toEqual({ state: [], passage: [] });
  });
});
