/** @vitest-environment jsdom */

import { createRoot } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mockedStore = vi.hoisted(() => ({
  nav: 'search' as 'search' | 'state',
  query: '',
  stateFrame: null as any,
  passages: [] as any[],
}));

const { findStateMatchesMock, findPassageMatchesMock, scheduleGateMock } = vi.hoisted(() => ({
  findStateMatchesMock: vi.fn(),
  findPassageMatchesMock: vi.fn(),
  scheduleGateMock: vi.fn(() => true),
}));

vi.mock('@solid-primitives/scheduled', () => ({
  createScheduled: vi.fn(() => scheduleGateMock),
  scheduleIdle: vi.fn((fn: () => void) => fn()),
}));

vi.mock('@/devtools-panel/store', () => ({
  createGetViewState: vi.fn((view: string, key: string) => {
    if (view === 'search' && key === 'query') return () => mockedStore.query;
    return () => undefined;
  }),
  getNavigationPage: vi.fn(() => mockedStore.nav),
  getLatestStateFrame: vi.fn(() => mockedStore.stateFrame),
  getPassageData: vi.fn(() => mockedStore.passages),
}));

vi.mock('./search-utils', () => ({
  findStateMatches: findStateMatchesMock,
  findPassageMatches: findPassageMatchesMock,
}));

import { createSearchResults } from './create-searchResults';

describe('createSearchResults', () => {
  beforeEach(() => {
    findStateMatchesMock.mockReset();
    findPassageMatchesMock.mockReset();
    scheduleGateMock.mockReset();
    scheduleGateMock.mockReturnValue(true);
    mockedStore.nav = 'search';
    mockedStore.query = '';
    mockedStore.stateFrame = null;
    mockedStore.passages = [];
  });

  it('should return empty results when page is not search', async () => {
    mockedStore.nav = 'state';
    mockedStore.query = 'x';
    mockedStore.stateFrame = { state: { x: 1 } };

    const results = await runInRoot(async () => createSearchResults()());

    expect(results).toEqual({ state: [], passage: [] });
    expect(findStateMatchesMock).not.toHaveBeenCalled();
    expect(findPassageMatchesMock).not.toHaveBeenCalled();
  });

  it('should return empty results when query or state is missing', async () => {
    mockedStore.query = '';
    mockedStore.stateFrame = { state: { x: 1 } };

    const results = await runInRoot(async () => createSearchResults()());

    expect(results).toEqual({ state: [], passage: [] });
    expect(findStateMatchesMock).not.toHaveBeenCalled();
  });

  it('should skip search when schedule gate returns false', async () => {
    scheduleGateMock.mockReturnValue(false);
    mockedStore.query = 'hp';
    mockedStore.stateFrame = { state: { hp: 10 } };

    const results = await runInRoot(async () => createSearchResults()());

    expect(results).toEqual({ state: [], passage: [] });
    expect(findStateMatchesMock).not.toHaveBeenCalled();
    expect(findPassageMatchesMock).not.toHaveBeenCalled();
  });

  it('should merge state and passage results when search executes', async () => {
    mockedStore.query = 'hp';
    mockedStore.stateFrame = { state: { hp: 10 } };
    mockedStore.passages = [{ id: 1, name: 'Start' }];

    findStateMatchesMock.mockReturnValue([Promise.resolve([{ path: ['hp'], value: 10 }]), vi.fn()]);
    findPassageMatchesMock.mockReturnValue([Promise.resolve([{ id: 1, name: 'Start' }]), vi.fn()]);

    const results = await runInRoot(async () => {
      const getResults = createSearchResults();
      await flush();
      await flush();
      return getResults();
    });

    expect(findStateMatchesMock).toHaveBeenCalledWith({ hp: 10 }, 'hp');
    expect(findPassageMatchesMock).toHaveBeenCalledWith([{ id: 1, name: 'Start' }], 'hp');
    expect(results).toEqual({
      state: [{ path: ['hp'], value: 10 }],
      passage: [{ id: 1, name: 'Start' }],
    });
  });

  it('should swallow search errors and keep previous results shape', async () => {
    mockedStore.query = 'hp';
    mockedStore.stateFrame = { state: { hp: 10 } };

    findStateMatchesMock.mockReturnValue([Promise.reject(new Error('boom')), vi.fn()]);
    findPassageMatchesMock.mockReturnValue([Promise.resolve([{ id: 1, name: 'Start' }]), vi.fn()]);

    const results = await runInRoot(async () => {
      const getResults = createSearchResults();
      await flush();
      await flush();
      return getResults();
    });

    expect(results).toEqual({ state: [], passage: [] });
  });
});

async function runInRoot<T>(fn: () => Promise<T> | T): Promise<T> {
  return createRoot(async (dispose) => {
    try {
      return await fn();
    } finally {
      dispose();
    }
  });
}

async function flush() {
  await Promise.resolve();
}
