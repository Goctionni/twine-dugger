/** @vitest-environment jsdom */

import { createRoot } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../api/api', () => ({
  getPassageData: vi.fn<(...args: any[]) => any>(async () => []),
  getState: vi.fn<(...args: any[]) => any>(async () => ({ state: {} })),
  getUpdates: vi.fn<(...args: any[]) => any>(async () => null),
  setStatePropertyLocks: vi.fn<(...args: any[]) => any>(async () => undefined),
}));

describe('store/index', () => {
  let disposeStoreRoot: (() => void) | null = null;
  let errorSpy: { mockRestore: () => void } | null = null;
  let warnSpy: { mockRestore: () => void } | null = null;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();

    const shouldSuppress = (args: unknown[]) =>
      args.some((arg) =>
        String(arg).includes('computations created outside a `createRoot` or `render`'),
      );

    const originalError = console.error;
    const originalWarn = console.warn;

    errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (shouldSuppress(args)) return;
      originalError(...(args as Parameters<typeof console.error>));
    });

    warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (shouldSuppress(args)) return;
      originalWarn(...(args as Parameters<typeof console.warn>));
    });
  });

  afterEach(() => {
    disposeStoreRoot?.();
    disposeStoreRoot = null;
    errorSpy?.mockRestore();
    warnSpy?.mockRestore();
    errorSpy = null;
    warnSpy = null;
    vi.useRealTimers();
  });

  const importStoreInRoot = async () => {
    return createRoot(async (dispose) => {
      disposeStoreRoot = dispose;
      return import('./index');
    });
  };

  it('should use default global settings and allow updates', async () => {
    const store = await importStoreInRoot();

    expect(store.createGetSetting('diffLog.pollingInterval')()).toBe(200);

    store.setSetting('diffLog.pollingInterval', 500);
    expect(store.createGetSetting('diffLog.pollingInterval')()).toBe(500);
  });

  it('should load global settings from localStorage when valid JSON is present', async () => {
    localStorage.setItem(
      'twine-dugger-settings',
      JSON.stringify({ 'diffLog.pollingInterval': 350, 'state.propertyOrder': 'none' }),
    );

    const store = await importStoreInRoot();

    expect(store.createGetSetting('diffLog.pollingInterval')()).toBe(350);
    expect(store.createGetSetting('state.propertyOrder')()).toBe('none');
  });

  it('should add/remove filtered and locked paths without duplicates', async () => {
    const store = await importStoreInRoot();
    store.setGameMetaData({ ifId: 'IFID-LOCKS', name: 'Mock' } as any);

    store.addFilteredPath(['a']);
    store.addFilteredPath(['a']);
    expect(store.getFilteredPaths()).toStrictEqual([['a']]);

    store.removeFilteredPath(['a']);
    expect(store.getFilteredPaths()).toStrictEqual([]);

    store.addLockPath(['a', 'b']);
    store.addLockPath(['a', 'b']);
    expect(store.getLockedPaths()).toStrictEqual([['a', 'b']]);

    store.removeLockPath(['a', 'b']);
    expect(store.getLockedPaths()).toStrictEqual([]);
  });

  it.skip('BUG_TEST: addFilteredPath/addLockPath before metadata initialization can throw', async () => {
    const store = await importStoreInRoot();

    expect(() => store.addFilteredPath(['a'])).not.toThrow();
    expect(() => store.addLockPath(['a'])).not.toThrow();
  });

  it('should load game scoped filtered paths from localStorage when metadata set', async () => {
    localStorage.setItem(
      'twine-dugger-IFID-TEST',
      JSON.stringify({ filteredPaths: [['player', 'hp']], lockedPaths: [['old', 'lock']] }),
    );

    const store = await importStoreInRoot();
    store.setGameMetaData({ ifId: 'IFID-TEST', name: 'Mock' } as any);

    expect(store.getFilteredPaths()).toStrictEqual([['player', 'hp']]);
    // locked paths intentionally reset to default in loadGameSettings
    expect(store.getLockedPaths()).toStrictEqual([]);
  });

  it('should tolerate malformed game config JSON and fall back to defaults', async () => {
    localStorage.setItem('twine-dugger-IFID-TEST', '{bad-json');

    const store = await importStoreInRoot();
    store.setGameMetaData({ ifId: 'IFID-TEST', name: 'Mock' } as any);

    expect(store.getFilteredPaths()).toStrictEqual([]);
    expect(store.getLockedPaths()).toStrictEqual([]);
  });

  it.skip('BUG_TEST: malformed global settings JSON should not throw during module init', async () => {
    localStorage.setItem('twine-dugger-settings', '{bad-json');

    await expect(importStoreInRoot()).resolves.toBeTruthy();
  });

  it('should start tracking frames, parse passage data, and append diff/history frames', async () => {
    vi.useFakeTimers();
    const api = await import('../api/api');
    vi.mocked(api.getState).mockResolvedValue({ state: { hp: 1 } } as any);
    vi.mocked(api.getPassageData).mockResolvedValue([
      {
        pid: '1',
        name: 'Start',
        size: '100,200',
        position: '10,20',
        tags: 'intro test',
        content: 'Hello',
      },
    ] as any);

    vi.mocked(api.getUpdates)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({
        diffPackage: {
          passage: 'Start',
          diffs: [{ type: 'number', path: ['hp'], oldValue: 1, newValue: 2 }],
        },
        locksUpdate: null,
      } as any);

    const store = await importStoreInRoot();
    const stop = await store.startTrackingFrames();

    expect(store.getConnectionState()).toBe('live');
    expect(store.getPassageData()[0]).toStrictEqual({
      id: 1,
      name: 'Start',
      size: [100, 200],
      position: [10, 20],
      tags: ['intro', 'test'],
      content: 'Hello',
    });

    await vi.advanceTimersByTimeAsync(220);

    expect(store.getDiffFrames().length).toBe(1);
    expect(store.getHistoryIds()).toStrictEqual([1, 0]);
    expect(store.getLockedPaths()).toStrictEqual([]);

    store.clearDiffFrames();
    expect(store.getDiffFrames()).toStrictEqual([]);

    stop();
  });

  it('should set error connection state when initial state load fails', async () => {
    vi.useFakeTimers();
    const api = await import('../api/api');
    vi.mocked(api.getState).mockResolvedValue(null as any);
    vi.mocked(api.getPassageData).mockResolvedValue([] as any);
    vi.mocked(api.getUpdates).mockResolvedValue(null as any);

    const store = await importStoreInRoot();
    const stop = await store.startTrackingFrames();

    expect(store.getConnectionState()).toBe('error');
    stop();
  });

  it('should bootstrap state locks to content script when stored lock paths exist', async () => {
    vi.useFakeTimers();

    const api = await import('../api/api');
    vi.mocked(api.getState).mockResolvedValue({ state: { hp: 1 } } as any);
    vi.mocked(api.getPassageData).mockResolvedValue([] as any);
    vi.mocked(api.getUpdates).mockResolvedValue(null as any);

    const store = await importStoreInRoot();
    store.setGameMetaData({ ifId: 'IFID-LOCKS', name: 'Mock' } as any);
    store.addLockPath(['hp']);

    const stop = await store.startTrackingFrames();

    expect(api.setStatePropertyLocks).toHaveBeenCalledWith([['hp']]);
    stop();
  });

  it('should apply locksUpdate from update loop when gameConfig exists', async () => {
    vi.useFakeTimers();
    const api = await import('../api/api');
    vi.mocked(api.getState).mockResolvedValue({ state: { hp: 1 } } as any);
    vi.mocked(api.getPassageData).mockResolvedValue([] as any);
    vi.mocked(api.getUpdates)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ diffPackage: null, locksUpdate: [['hp']] } as any);

    const store = await importStoreInRoot();
    store.setGameMetaData({ ifId: 'IFID-UPDATE', name: 'Mock' } as any);

    const stop = await store.startTrackingFrames();
    await vi.advanceTimersByTimeAsync(220);

    expect(store.getLockedPaths()).toStrictEqual([['hp']]);
    stop();
  });

  it('should persist game settings to localStorage after config updates', async () => {
    const store = await importStoreInRoot();
    store.setGameMetaData({ ifId: 'IFID-PERSIST', name: 'Mock' } as any);
    store.addFilteredPath(['player', 'hp']);

    const raw = localStorage.getItem('twine-dugger-IFID-PERSIST');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toStrictEqual({
      filteredPaths: [['player', 'hp']],
      lockedPaths: [],
    });
  });

  it.skip('BUG_TEST: startTrackingFrames can throw when locksUpdate arrives before gameConfig init', async () => {
    vi.useFakeTimers();
    const api = await import('../api/api');
    vi.mocked(api.getState).mockResolvedValue({ state: { hp: 1 } } as any);
    vi.mocked(api.getPassageData).mockResolvedValue([] as any);
    vi.mocked(api.getUpdates)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ diffPackage: null, locksUpdate: [['hp']] } as any);

    const store = await importStoreInRoot();
    const stop = await store.startTrackingFrames();
    await vi.advanceTimersByTimeAsync(220);
    expect(store.getLockedPaths()).toStrictEqual([['hp']]);
    stop();
  });
});
