import { createEffect, createRoot, createStore, deep } from 'solid-js';

import { pathEquals, pathStartsWith } from '@/shared/path-equals';
import type { GameMetaData, Path } from '@/shared/shared-types';

import type { GameConfig, Settings, StoreData } from './store-types';

// What is edited in place: connection, settings, config and what each view is looking at.
// The state of the game is in `game-state.ts`, the locks in `locks.ts` and the passages in
// `passages.ts`. They use `store` and `setViewState` from here.

const LS_PREFIX = 'twine-dugger-';
const getGameSettingsKey = (ifId: string) => `${LS_PREFIX}${ifId}`;
const getGlobalSettingsKey = () => `${LS_PREFIX}settings`;

const defaultSettings: Settings = {
  'diffLog.fontSize': 14,
  'diffLog.pollingInterval': 200,
  'diffLog.maxHistorySlices': 50,
  'diffLog.headingStyle': 'default',
  'state.propertyOrder': 'type',
  'state.propertyOrderDesc': false,
  'state.filters': [],
};

function loadGlobalSettings(): Settings {
  try {
    const saved = localStorage.getItem(getGlobalSettingsKey());
    if (saved) return { ...defaultSettings, ...(JSON.parse(saved) as Partial<Settings>) };
  } catch {
    // Settings that can't be read are the same as no settings
  }
  return { ...defaultSettings };
}

function loadGameConfig(ifId: string): GameConfig {
  try {
    const saved = localStorage.getItem(getGameSettingsKey(ifId));
    if (saved) {
      const config = JSON.parse(saved) as Partial<GameConfig>;
      return { filteredPaths: config.filteredPaths ?? [], locks: config.locks ?? [] };
    }
  } catch {
    // Config that can't be read is the same as no config
  }
  return { filteredPaths: [], locks: [] };
}

export const [store, setStore] = createStore<StoreData>({
  connectionState: 'loading-meta',
  candidateIframes: [],
  gameMeta: null,
  gameConfig: { filteredPaths: [], locks: [] },
  settings: loadGlobalSettings(),
  viewState: {
    activeTab: 'state',
    state: { historyRef: 'latest', path: [] },
    passage: { selected: null },
    search: { query: '', resultTab: 'state' },
  },
});

createRoot(() => {
  createEffect(
    () => deep(store.settings),
    (settings) => {
      localStorage.setItem(getGlobalSettingsKey(), JSON.stringify(settings));
    },
  );

  // The config belongs to the game, so it's kept under the id of the game
  createEffect(
    () => ({ ifId: store.gameMeta?.ifId, config: deep(store.gameConfig) }),
    ({ ifId, config }) => {
      if (ifId) localStorage.setItem(getGameSettingsKey(ifId), JSON.stringify(config));
    },
  );
});

// --- Connection & meta

export const getConnectionState = () => store.connectionState;
export const setConnectionState = (connection: StoreData['connectionState']) =>
  setStore((draft) => {
    draft.connectionState = connection;
  });

export const getCandidateIframes = () => store.candidateIframes;
export const setCandidateIframes = (urls: string[]) =>
  setStore((draft) => {
    draft.candidateIframes = urls;
  });

export const getGameMetaData = () => store.gameMeta;
export function setGameMetaData(meta: GameMetaData) {
  setStore((draft) => {
    draft.gameMeta = meta;
    draft.gameConfig = loadGameConfig(meta.ifId);
  });
}

// --- Navigation & view state

export const getNavigationPage = () => store.viewState.activeTab;
export const setNavigationPage = (page: StoreData['viewState']['activeTab']) =>
  setStore((draft) => {
    draft.viewState.activeTab = page;
  });

type ViewState = StoreData['viewState'];
type ViewName = Exclude<keyof ViewState, 'activeTab'>;

export const createGetViewState =
  <TView extends ViewName, TProperty extends keyof ViewState[TView]>(
    view: TView,
    property: TProperty,
  ) =>
  (): ViewState[TView][TProperty] =>
    store.viewState[view][property];

export const setViewState = <TView extends ViewName, TProperty extends keyof ViewState[TView]>(
  view: TView,
  property: TProperty,
  value: ViewState[TView][TProperty],
) =>
  setStore((draft) => {
    draft.viewState[view][property] = value;
  });

// --- Settings

export const createGetSetting =
  <T extends keyof Settings>(setting: T) =>
  (): Settings[T] =>
    store.settings[setting];

export const setSetting = <T extends keyof Settings>(setting: T, value: Settings[T]) =>
  setStore((draft) => {
    draft.settings[setting] = value;
  });

export const createSetSetting =
  <T extends keyof Settings>(setting: T) =>
  (value: Settings[T]) =>
    setSetting(setting, value);

// --- Filtered paths: changes to these are left out of the diff log

export const getFilteredPaths = () => store.gameConfig.filteredPaths;

export const isPathFiltered = (path: Path) =>
  store.gameConfig.filteredPaths.some((filterPath) => pathStartsWith(path, filterPath));

export const addFilteredPath = (path: Path) =>
  setStore((draft) => {
    const { filteredPaths } = draft.gameConfig;
    if (!filteredPaths.some((current) => pathEquals(current, path))) filteredPaths.push([...path]);
  });

export const removeFilteredPath = (path: Path) =>
  setStore((draft) => {
    draft.gameConfig.filteredPaths = draft.gameConfig.filteredPaths.filter(
      (current) => !pathEquals(current, path),
    );
  });

export const clearFilteredPaths = () =>
  setStore((draft) => {
    draft.gameConfig.filteredPaths = [];
  });
