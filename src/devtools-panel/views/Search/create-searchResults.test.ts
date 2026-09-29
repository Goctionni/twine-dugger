import { createRoot, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ParsedPassageData } from '@/shared/shared-types';

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

const store = await import('../../store/store');
const utils = await import('./search-utils');
const { createSearchResults } = await import('./create-searchResults');

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
  store.resetGameState({ boss: 'dragon', list: ['dragon fly', 'newt'] });
  store.setPassageData(passages);
  store.setNavigationPage('search');
  store.setViewState('search', 'query', '');
  flush();
});
afterEach(() => vi.useRealTimers());

/** Lets the timers and the promises of a search run */
const settle = async (ms = 10) => {
  await vi.advanceTimersByTimeAsync(ms);
  flush();
  await vi.advanceTimersByTimeAsync(0);
};

const setup = () => {
  let results!: ReturnType<typeof createSearchResults>;
  const dispose = createRoot((dispose) => {
    results = createSearchResults();
    return dispose;
  });
  return { results, dispose };
};

const type = async (query: string) => {
  store.setViewState('search', 'query', query);
  flush();
  await settle();
};

describe('createSearchResults', () => {
  it('searches, and narrows the results while the query gets longer', async () => {
    const { results, dispose } = setup();

    await type('dr');
    expect(utils.findStateMatches).toHaveBeenCalledTimes(1);
    expect(results().state.map((r) => r.path.join('.'))).toEqual(['boss', 'list.0']);
    expect(results().passage.map((p) => p.id)).toEqual([1]);

    await type('drag');
    await type('dragon f');
    expect(utils.findStateMatches).toHaveBeenCalledTimes(1);
    expect(utils.findPassageMatches).toHaveBeenCalledTimes(1);
    expect(results().state.map((r) => r.path.join('.'))).toEqual(['list.0']);
    expect(results().passage).toEqual([]);

    // A shorter query has to look at everything again
    await type('d');
    expect(utils.findStateMatches).toHaveBeenCalledTimes(2);
    dispose();
  });

  it('refreshes the results for new diffs at most once a second, and never narrows stale ones', async () => {
    const { results, dispose } = setup();
    await type('dr');
    expect(utils.findStateMatches).toHaveBeenCalledTimes(1);

    const change = (value: string) => {
      store.applyUpdate({
        passage: 'P',
        delta: { boss: [value === 'dragon' ? 'newt' : 'dragon', value] } as never,
        reverts: [],
        initialized: false,
      });
      flush();
    };

    // The state changes, and the results follow after the second
    change('dragon');
    await settle(500);
    expect(utils.findStateMatches).toHaveBeenCalledTimes(1);
    change('dragon');
    await settle(499);
    expect(utils.findStateMatches).toHaveBeenCalledTimes(1);
    await settle(1);
    expect(utils.findStateMatches).toHaveBeenCalledTimes(2);

    // Typing right after a diff can't narrow results that were made from the old state
    change('newt');
    await type('dra');
    expect(utils.findStateMatches).toHaveBeenCalledTimes(3);
    expect(results().state.map((r) => r.path.join('.'))).toEqual(['list.0']);
    dispose();
  });

  it('does nothing while another page is open, and clears when the query is', async () => {
    const { results, dispose } = setup();
    store.setNavigationPage('state');
    await type('dr');
    expect(utils.findStateMatches).not.toHaveBeenCalled();

    store.setNavigationPage('search');
    flush();
    await settle();
    expect(results().state.length).toBeGreaterThan(0);

    await type('');
    expect(results()).toEqual({ state: [], passage: [] });
    dispose();
  });
});
