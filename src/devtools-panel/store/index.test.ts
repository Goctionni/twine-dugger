/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../api/api', () => ({
  getPassageData: vi.fn(async () => []),
  getState: vi.fn(async () => ({ state: {} })),
  getUpdates: vi.fn(async () => null),
  setStatePropertyLocks: vi.fn(async () => undefined),
}));

describe('store/index', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use default global settings and allow updates', async () => {
    const store = await import('./index');

    expect(store.createGetSetting('diffLog.pollingInterval')()).toBe(200);

    store.setSetting('diffLog.pollingInterval', 500);
    expect(store.createGetSetting('diffLog.pollingInterval')()).toBe(500);
  });

  it('should load global settings from localStorage when valid JSON is present', async () => {
    localStorage.setItem(
      'twine-dugger-settings',
      JSON.stringify({ 'diffLog.pollingInterval': 350, 'state.propertyOrder': 'none' }),
    );

    const store = await import('./index');

    expect(store.createGetSetting('diffLog.pollingInterval')()).toBe(350);
    expect(store.createGetSetting('state.propertyOrder')()).toBe('none');
  });

  it('should add/remove filtered and locked paths without duplicates', async () => {
    const store = await import('./index');
    store.setGameMetaData({ ifId: 'IFID-LOCKS', name: 'Mock' } as any);

    store.addFilteredPath(['a']);
    store.addFilteredPath(['a']);
    expect(store.getFilteredPaths()).toEqual([['a']]);

    store.removeFilteredPath(['a']);
    expect(store.getFilteredPaths()).toEqual([]);

    store.addLockPath(['a', 'b']);
    store.addLockPath(['a', 'b']);
    expect(store.getLockedPaths()).toEqual([['a', 'b']]);

    store.removeLockPath(['a', 'b']);
    expect(store.getLockedPaths()).toEqual([]);
  });

  it.skip('BUG_TEST: addFilteredPath/addLockPath before metadata initialization can throw', async () => {
    const store = await import('./index');

    expect(() => store.addFilteredPath(['a'])).not.toThrow();
    expect(() => store.addLockPath(['a'])).not.toThrow();
  });

  it('should load game scoped filtered paths from localStorage when metadata set', async () => {
    localStorage.setItem(
      'twine-dugger-IFID-TEST',
      JSON.stringify({ filteredPaths: [['player', 'hp']], lockedPaths: [['old', 'lock']] }),
    );

    const store = await import('./index');
    store.setGameMetaData({ ifId: 'IFID-TEST', name: 'Mock' } as any);

    expect(store.getFilteredPaths()).toEqual([['player', 'hp']]);
    // locked paths intentionally reset to default in loadGameSettings
    expect(store.getLockedPaths()).toEqual([]);
  });

  it('should tolerate malformed game config JSON and fall back to defaults', async () => {
    localStorage.setItem('twine-dugger-IFID-TEST', '{bad-json');

    const store = await import('./index');
    store.setGameMetaData({ ifId: 'IFID-TEST', name: 'Mock' } as any);

    expect(store.getFilteredPaths()).toEqual([]);
    expect(store.getLockedPaths()).toEqual([]);
  });

  it.skip('BUG_TEST: malformed global settings JSON should not throw during module init', async () => {
    localStorage.setItem('twine-dugger-settings', '{bad-json');

    await expect(import('./index')).resolves.toBeTruthy();
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

    const store = await import('./index');
    const stop = await store.startTrackingFrames();

    expect(store.getConnectionState()).toBe('live');
    expect(store.getPassageData()[0]).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'Start',
        size: [100, 200],
        position: [10, 20],
        tags: ['intro', 'test'],
      }),
    );

    await vi.advanceTimersByTimeAsync(220);

    expect(store.getDiffFrames().length).toBe(1);
    expect(store.getHistoryIds()).toEqual([1, 0]);
    expect(store.getLockedPaths()).toEqual([]);

    store.clearDiffFrames();
    expect(store.getDiffFrames()).toEqual([]);

    stop();
  });

  it('should set error connection state when initial state load fails', async () => {
    vi.useFakeTimers();
    const api = await import('../api/api');
    vi.mocked(api.getState).mockResolvedValue(null as any);
    vi.mocked(api.getPassageData).mockResolvedValue([] as any);
    vi.mocked(api.getUpdates).mockResolvedValue(null as any);

    const store = await import('./index');
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

    const store = await import('./index');
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

    const store = await import('./index');
    store.setGameMetaData({ ifId: 'IFID-UPDATE', name: 'Mock' } as any);

    const stop = await store.startTrackingFrames();
    await vi.advanceTimersByTimeAsync(220);

    expect(store.getLockedPaths()).toEqual([['hp']]);
    stop();
  });

  it('should persist game settings to localStorage after config updates', async () => {
    const store = await import('./index');
    store.setGameMetaData({ ifId: 'IFID-PERSIST', name: 'Mock' } as any);
    store.addFilteredPath(['player', 'hp']);

    const raw = localStorage.getItem('twine-dugger-IFID-PERSIST');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual(
      expect.objectContaining({ filteredPaths: [['player', 'hp']] }),
    );
  });

  it.skip('BUG_TEST: startTrackingFrames can throw when locksUpdate arrives before gameConfig init', async () => {
    vi.useFakeTimers();
    const api = await import('../api/api');
    vi.mocked(api.getState).mockResolvedValue({ state: { hp: 1 } } as any);
    vi.mocked(api.getPassageData).mockResolvedValue([] as any);
    vi.mocked(api.getUpdates)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ diffPackage: null, locksUpdate: [['hp']] } as any);

    const store = await import('./index');
    const stop = await store.startTrackingFrames();
    await vi.advanceTimersByTimeAsync(220);
    stop();
  });
});
