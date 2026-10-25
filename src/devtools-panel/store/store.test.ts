import { createRoot, flush } from 'solid-js';
import { beforeEach, describe, expect, it, onTestFinished } from 'vite-plus/test';

import { fromJson } from '@/shared/from-json';

import {
  createPersistenceEffects,
  isPinned,
  setGameMetaData,
  setSetting,
  setStore,
  store,
  togglePin,
} from './store';
import { gameConfigSchema, settingsSchema } from './store-types';

const key = 'twine-dugger-game-1';
const meta = { ifId: 'game-1' } as never;

beforeEach(() => {
  localStorage.clear();
  setStore((draft) => {
    draft.gameMeta = null;
    draft.gameConfig = { locks: [], filteredPaths: [], pins: [] };
  });
  flush();
});

function persist() {
  createRoot((dispose) => {
    createPersistenceEffects();
    onTestFinished(dispose);
  });
  flush();
}

describe('persistence', () => {
  it('loads the config of a game, and keeps what was saved', () => {
    const saved = {
      locks: [
        { path: ['hp'], value: 10 },
        { path: ['name'], value: 'Ada' },
        { path: ['flag'], value: false },
        { path: ['list'], value: [1, 2] },
      ],
      filteredPaths: [['log', 0]],
      pins: [['a', 'b']],
    };
    localStorage.setItem(key, JSON.stringify(saved));
    persist();

    setGameMetaData(meta);
    flush();

    expect(store.gameConfig).toEqual(saved);
    expect(fromJson(localStorage.getItem(key)!, gameConfigSchema)).toEqual(saved);
  });

  it('starts from an empty config for a game that has none saved', () => {
    persist();
    setGameMetaData(meta);
    flush();
    expect(store.gameConfig).toEqual({ locks: [], filteredPaths: [], pins: [] });
  });

  it('keeps the config of a game without an ifid under its name', () => {
    persist();
    setGameMetaData({ ifId: '', name: 'My Game' } as never);
    setStore((draft) => {
      draft.gameConfig.filteredPaths = [['log']];
    });
    flush();

    const saved = fromJson(localStorage.getItem('twine-dugger-name:My Game')!, gameConfigSchema);
    expect(saved.filteredPaths).toEqual([['log']]);

    setGameMetaData({ ifId: '', name: 'Other' } as never);
    flush();
    expect(store.gameConfig.filteredPaths).toEqual([]);
    setGameMetaData({ ifId: '', name: 'My Game' } as never);
    flush();
    expect(store.gameConfig.filteredPaths).toEqual([['log']]);
  });

  it('does not save a config for a game with neither an ifid nor a name', () => {
    persist();
    setGameMetaData({ ifId: '', name: 'Untitled' } as never);
    setStore((draft) => {
      draft.gameConfig.filteredPaths = [['log']];
    });
    flush();

    expect(Object.keys(localStorage)).toEqual(['twine-dugger-settings']);
  });

  it('saves the global settings', () => {
    persist();
    onTestFinished(() => setSetting('diffLog.fontSize', 14));
    setSetting('diffLog.fontSize', 20);
    flush();

    const saved = fromJson(localStorage.getItem('twine-dugger-settings')!, settingsSchema);
    expect(saved['diffLog.fontSize']).toBe(20);
  });
});

describe('pins', () => {
  it('pins a path, which also marks the paths above it, and unpins it with what is beneath', () => {
    togglePin(['a', 'b', 'c']);
    togglePin(['a', 'x']);
    flush();

    expect(isPinned(['a', 'b', 'c'])).toBe(true);
    expect(isPinned(['a', 'b'])).toBe(true);
    expect(isPinned(['a'])).toBe(true);
    expect(isPinned([])).toBe(true);
    expect(isPinned(['a', 'b', 'c', 'd'])).toBe(false);
    expect(isPinned(['other'])).toBe(false);

    togglePin(['a', 'b']);
    flush();
    expect(isPinned(['a', 'b', 'c'])).toBe(false);
    expect(isPinned(['a', 'x'])).toBe(true);
    expect(store.gameConfig.pins).toEqual([['a', 'x']]);
  });

  it('pins only the path itself without the cascade', () => {
    setSetting('state.pinCascade', false);
    onTestFinished(() => setSetting('state.pinCascade', true));
    togglePin(['a', 'b', 'c']);
    togglePin(['a', 'b']);
    flush();

    expect(isPinned(['a', 'b'])).toBe(true);
    expect(isPinned(['a', 'b', 'c'])).toBe(true);
    expect(isPinned(['a'])).toBe(false);

    togglePin(['a', 'b']);
    flush();
    expect(isPinned(['a', 'b'])).toBe(false);
    expect(store.gameConfig.pins).toEqual([['a', 'b', 'c']]);
  });
});
