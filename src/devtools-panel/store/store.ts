import { createEffect, createRoot, createStore, deep } from 'solid-js';

import { fromJson } from '@/shared/from-json';
import { pathEquals, pathStartsWith } from '@/shared/path-equals';
import type { GameMetaData, Page, Path } from '@/shared/shared-types';

import {
  gameConfigSchema,
  settingsSchema,
  type GameConfig,
  type Settings,
  type StoreData,
} from './store-types';

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
    const saved = localStorage.getItem(getGlobalSettingsKey()) || '{}';
    return { ...defaultSettings, ...fromJson(saved, settingsSchema.partial()) };
  } catch {
    return { ...defaultSettings };
  }
}

function loadGameConfig(ifId: string): GameConfig {
  try {
    const saved = localStorage.getItem(getGameSettingsKey(ifId));
    if (saved) {
      const config = fromJson(saved, gameConfigSchema.partial());
      return { filteredPaths: config.filteredPaths ?? [], locks: config.locks ?? [] };
    }
  } catch {}
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
    passages: { selected: null },
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

export const getConnectionState = () => store.connectionState;
export function setConnectionState(connection: StoreData['connectionState']) {
  setStore((draft) => {
    draft.connectionState = connection;
  });
}

export const getCandidateIframes = () => store.candidateIframes;
export function setCandidateIframes(urls: string[]) {
  setStore((draft) => {
    draft.candidateIframes = urls;
  });
}

export const getGameMetaData = () => store.gameMeta;
export function setGameMetaData(meta: GameMetaData) {
  setStore((draft) => {
    draft.gameMeta = meta;
    draft.gameConfig = loadGameConfig(meta.ifId);
  });
}

export const getNavigationPage = () => store.viewState.activeTab;
export function setNavigationPage(page: Page) {
  setStore((draft) => {
    draft.viewState.activeTab = page;
  });
}

type ViewState = StoreData['viewState'];
type ViewName = Exclude<Page, 'settings'>;

export function createGetViewState<
  TView extends ViewName,
  TProperty extends keyof ViewState[TView],
>(view: TView, property: TProperty) {
  return (): ViewState[TView][TProperty] => {
    return store.viewState[view][property];
  };
}

export function setViewState<TView extends ViewName, TProperty extends keyof ViewState[TView]>(
  view: TView,
  property: TProperty,
  value: ViewState[TView][TProperty],
) {
  return setStore((draft) => {
    draft.viewState[view][property] = value;
  });
}

export function createGetSetting<T extends keyof Settings>(setting: T) {
  return (): Settings[T] => store.settings[setting];
}

export function setSetting<T extends keyof Settings>(setting: T, value: Settings[T]) {
  setStore((draft) => {
    draft.settings[setting] = value;
  });
}

export function createSetSetting<T extends keyof Settings>(setting: T) {
  return (value: Settings[T]) => setSetting(setting, value);
}

export const getFilteredPaths = () => store.gameConfig.filteredPaths;

export function isPathFiltered(path: Path) {
  return store.gameConfig.filteredPaths.some((filterPath) => pathStartsWith(path, filterPath));
}

export function addFilteredPath(path: Path) {
  setStore((draft) => {
    const { filteredPaths } = draft.gameConfig;
    if (!filteredPaths.some((current) => pathEquals(current, path))) filteredPaths.push([...path]);
  });
}

export function removeFilteredPath(path: Path) {
  setStore((draft) => {
    draft.gameConfig.filteredPaths = draft.gameConfig.filteredPaths.filter(
      (current) => !pathEquals(current, path),
    );
  });
}

export function clearFilteredPaths() {
  setStore((draft) => {
    draft.gameConfig.filteredPaths = [];
  });
}
