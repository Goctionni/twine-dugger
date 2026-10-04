import { createEffect, createStore, deep } from 'solid-js';

import { fromJson } from '@/shared/from-json';
import { pathEquals, pathStartsWith } from '@/shared/path-equals';
import type { GameMetaData, Page, Path } from '@/shared/shared-types';

import { defaultSearchOptions, defaultSearchScope, defaultSearchSort } from '../search/core/types';
import {
  gameConfigSchema,
  settingsSchema,
  type GameConfig,
  type Settings,
  type StoreData,
} from './store-types';

const LS_PREFIX = 'twine-dugger-';
const getGameSettingsKey = (gameId: string) => `${LS_PREFIX}${gameId}`;

// The name is only a fallback for games without an ifid. 'Untitled' is what the metadata falls back
// to, and every unnamed game would share a config under it.
const getGameId = (meta: Pick<GameMetaData, 'ifId' | 'name'> | null) => {
  if (meta?.ifId) return meta.ifId;
  return meta?.name && meta.name !== 'Untitled' ? `name:${meta.name}` : undefined;
};
const getGlobalSettingsKey = () => `${LS_PREFIX}settings`;

const defaultSettings: Settings = {
  'diffLog.fontSize': 14,
  'diffLog.pollingInterval': 200,
  'diffLog.maxHistorySlices': 30,
  'diffLog.headingStyle': 'default',
  'state.propertyOrder': 'type',
  'state.propertyOrderDesc': false,
  'state.filters': [],
  'editor.disableHighlighting': 'large',
  'search.narrowStyle': 'strip',
  'search.persist.options': false,
  'search.persist.scope': false,
  'search.persist.sort': false,
  'search.persist.typeFilter': false,
  'search.saved.options': defaultSearchOptions,
  'search.saved.scope': defaultSearchScope,
  'search.saved.sort': defaultSearchSort,
  'search.saved.typeFilter': [],
};

function loadGlobalSettings(): Settings {
  try {
    const saved = localStorage.getItem(getGlobalSettingsKey()) || '{}';
    return { ...defaultSettings, ...fromJson(saved, settingsSchema.partial()) };
  } catch {
    return { ...defaultSettings };
  }
}

function loadGameConfig(gameId: string | undefined): GameConfig {
  try {
    const saved = gameId && localStorage.getItem(getGameSettingsKey(gameId));
    if (saved) {
      const config = fromJson(saved, gameConfigSchema.partial());
      return { filteredPaths: config.filteredPaths ?? [], locks: config.locks ?? [] };
    }
  } catch {}
  return { filteredPaths: [], locks: [] };
}

function createInitialSearchState(settings: Settings): StoreData['viewState']['search'] {
  // Opted-in slices start from what was saved last time; the rest start from defaults
  const pick = <T>(persist: boolean, saved: T, fallback: T): T => (persist ? saved : fallback);
  return {
    query: '',
    options: pick(
      settings['search.persist.options'],
      settings['search.saved.options'],
      defaultSearchOptions,
    ),
    scope: pick(
      settings['search.persist.scope'],
      settings['search.saved.scope'],
      defaultSearchScope,
    ),
    sort: pick(settings['search.persist.sort'], settings['search.saved.sort'], defaultSearchSort),
    typeFilter: pick(
      settings['search.persist.typeFilter'],
      settings['search.saved.typeFilter'],
      [],
    ),
    tagFilter: [],
    view: 'both',
    collapsed: { state: false, passage: false },
  };
}

const initialSettings = loadGlobalSettings();

export const [store, setStore] = createStore<StoreData>({
  connectionState: 'loading-meta',
  candidateIframes: [],
  gameMeta: null,
  gameConfig: { filteredPaths: [], locks: [] },
  settings: initialSettings,
  viewState: {
    activeTab: 'state',
    state: { historyRef: 'latest', path: [] },
    passages: { selected: null },
    search: createInitialSearchState(initialSettings),
  },
});

/** Call once from a component: effects need an owner to be disposed with */
export function createPersistenceEffects() {
  createEffect(
    () => deep(store.settings),
    (settings) => {
      localStorage.setItem(getGlobalSettingsKey(), JSON.stringify(settings));
    },
  );

  // The config belongs to the game, so it's kept under the id of the game
  createEffect(
    () => ({ gameId: getGameId(store.gameMeta), config: deep(store.gameConfig) }),
    ({ gameId, config }) => {
      if (gameId) localStorage.setItem(getGameSettingsKey(gameId), JSON.stringify(config));
    },
  );
}

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
    draft.gameConfig = loadGameConfig(getGameId(meta));
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
