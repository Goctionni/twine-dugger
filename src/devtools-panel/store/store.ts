import { Accessor, batch, createEffect, createMemo, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

import { getObjectPathValue } from '@/shared/get-object-path-value';
import { pathEquals } from '@/shared/path-equals';
import { DiffFrame, Path, StateFrame } from '@/shared/shared-types';

import { ParsedPassageData, parsePassage } from '../components/Views/passageDataStore';
import {
  getPassageData as apiGetPassageData,
  getState as apiGetState,
  getUpdates,
} from '../utils/api';
import { GameMetaData } from '../utils/remote-functions/getMetaData';
import { applyDiffsToState } from './apply-diffs';

const LS_PREFIX = 'twine-dugger-';
const getGameSettingsKey = (ifId: string) => `${LS_PREFIX}${ifId}`;
const getGlobalSettingsKey = () => `${LS_PREFIX}settings`;

interface GameConfig {
  filteredPaths: Path[];
}

interface Settings {
  'diffLog.fontSize': number;
  'diffLog.pollingInterval': number;
  'diffLog.headingStyle': 'default' | 'distinct';
}

interface Store {
  connection: 'killed' | 'loading' | 'error' | 'live' | 'not-enabled';
  gameMetaData: GameMetaData | null;

  navigation: {
    view: 'state' | 'search' | 'passages' | 'settings';
  };
  viewState: {
    state: {
      historyId: number;
      path: Path;
      lockedPaths: Path[];
    };
    passage: {
      selected: ParsedPassageData | null;
    };
    search: {
      query: string;
    };
  };
  gameConfig: GameConfig | null;
  settings: Settings;
}

const [store, setStore] = createStore<Store>({
  connection: 'not-enabled',
  gameConfig: null,
  gameMetaData: null,
  navigation: {
    view: 'state',
  },
  viewState: {
    passage: {
      selected: null,
    },
    search: {
      query: '',
    },
    state: {
      historyId: 0,
      lockedPaths: [],
      path: [],
    },
  },
  settings: loadGlobalSettings(),
});

const [getStateFrames, setStateFrames] = createSignal<StateFrame[]>([]);
const [getDiffFrames, setDiffFrames] = createSignal<DiffFrame[]>([]);
const [getPassageData, setPassageData] = createSignal<ParsedPassageData[]>([]);

export { getDiffFrames, getPassageData };

export const getConnectionState = createMemo(() => store.connection);
export const getFilteredPaths = createMemo(() => store.gameConfig?.filteredPaths ?? []);
export const getGameMetaData = createMemo(() => store.gameMetaData);
export const getNavigationView = createMemo(() => store.navigation.view);

export const getActiveStateFrame = createMemo(() => {
  const historyId = store.viewState.state.historyId;
  if (historyId === 'latest') return getStateFrames()[0];
  return getStateFrames().find((frame) => frame.id === historyId);
});

export const getActiveState = createMemo(() => getActiveStateFrame()?.state);

export const getActiveStatePathValue = createMemo(() => {
  const path = store.viewState.state.path;
  const activeStateFrame = getActiveStateFrame();
  if (!activeStateFrame) return null;
  return getObjectPathValue(activeStateFrame.state, path);
});

export const getHistoryIds = createMemo(() => getStateFrames().map((frame) => frame.id));

export const createGetViewState = <
  TView extends keyof Store['viewState'],
  TProperty extends keyof Store['viewState'][TView],
>(
  view: TView,
  property: TProperty,
): Accessor<Store['viewState'][TView][TProperty]> => {
  const accessor = createMemo(() => store.viewState[view][property]);
  return accessor;
};

export const createGetSetting = <T extends keyof Store['settings']>(setting: T) => {
  const accessor = createMemo(() => store.settings[setting]);
  return accessor;
};

export const setViewState = <
  TView extends keyof Store['viewState'],
  TProperty extends keyof Store['viewState'][TView],
  TValue extends Store['viewState'][TView][TProperty],
>(
  view: TView,
  property: TProperty,
  value: TValue,
) => {
  setStore('viewState', view, property as any, value);
};

export const setConnectionState = (connection: Store['connection']) =>
  setStore('connection', connection);

export function setGameMetaData(meta: GameMetaData) {
  batch(() => {
    setStore('gameMetaData', meta);
    setStore('gameConfig', loadGameSettings());
  });
}

export const setNavigationView = (view: Store['navigation']['view']) => {
  setStore('navigation', 'view', view);
};

export const addFilteredPath = (path: Path) => {
  const current = store.gameConfig?.filteredPaths ?? [];
  if (current.some((currentPath) => pathEquals(currentPath, path))) return;
  setStore('gameConfig', 'filteredPaths', [...current, path]);
};

export const removeFilteredPath = (path: Path) => {
  const current = store.gameConfig?.filteredPaths ?? [];
  const newPaths = current.filter((currentPath) => !pathEquals(currentPath, path));
  setStore('gameConfig', 'filteredPaths', newPaths);
};

export const addLockPath = (path: Path) => {
  const current = store.viewState.state.lockedPaths;
  if (current.some((currentPath) => pathEquals(currentPath, path))) return;
  setStore('viewState', 'state', 'lockedPaths', [...current, path]);
};

export const removeLockPath = (path: Path) => {
  const current = store.viewState.state.lockedPaths;
  const newPaths = current.filter((currentPath) => !pathEquals(currentPath, path));
  setStore('gameConfig', 'filteredPaths', newPaths);
};

export const setSetting = <T extends keyof Store['settings']>(
  setting: T,
  value: Store['settings'][T],
) => {
  setStore('settings', setting, value);
};

export async function startTrackingFrames() {
  let timeout = 0;
  setConnectionState('loading');
  try {
    const [initialState, passageData] = await Promise.all([
      apiGetState(),
      apiGetPassageData(),
      getUpdates(), // this initializes the differ in the content script
    ]);
    if (!initialState) throw new Error();

    setStateFrames([{ id: 0, state: initialState.state }]);
    setPassageData(passageData.map(parsePassage));
    setDiffFrames([]);
    setConnectionState('live');

    const update = async () => {
      const timestamp = new Date();
      const updates = await getUpdates();
      if (updates) {
        const { diffPackage, locksUpdate } = updates;
        if (locksUpdate) setStore('viewState', 'state', 'lockedPaths', locksUpdate);
        if (diffPackage?.diffs.length) {
          const newFrame: DiffFrame = {
            timestamp,
            passage: diffPackage.passage,
            changes: diffPackage.diffs,
          };
          setDiffFrames((cur) => [newFrame, ...cur].slice(0, 50));
          setStateFrames((cur) => {
            const latestFrame = cur[0];
            if (!latestFrame) return cur;
            const newState = applyDiffsToState(latestFrame.state, diffPackage.diffs);
            const newStateFrame: StateFrame = {
              id: latestFrame.id + 1,
              state: newState,
              diffingFrame: newFrame,
            };
            return [newStateFrame, ...cur].slice(0, 50);
          });
        }
      }
      const interval = store.settings['diffLog.pollingInterval'];
      const elapsed = Date.now() - timestamp.getTime();
      const remainingDelay = Math.max(0, interval - elapsed);
      timeout = setTimeout(update, remainingDelay);
    };
    timeout = setTimeout(update, store.settings['diffLog.pollingInterval']);
  } catch (ex) {
    setConnectionState('error');
  }
  return () => clearTimeout(timeout);
}

// Utility functions

function loadGameSettings() {
  const defaultConfig: GameConfig = { filteredPaths: [] };
  const ifId = store.gameMetaData?.ifId;
  if (!ifId) return defaultConfig;

  const key = getGameSettingsKey(ifId);
  const lsData = localStorage.getItem(key);
  if (!lsData) return defaultConfig;

  return { ...defaultConfig, ...(JSON.parse(lsData) as Partial<GameConfig>) };
}

function saveGameSettings() {
  const ifId = store.gameMetaData?.ifId;
  if (!ifId) return;

  const key = getGameSettingsKey(ifId);
  localStorage.setItem(key, JSON.stringify(store.gameConfig));
}

function loadGlobalSettings() {
  const defaultSettings: Settings = {
    ['diffLog.fontSize']: 14,
    ['diffLog.pollingInterval']: 200,
    ['diffLog.headingStyle']: 'default',
  };
  const lsData = localStorage.getItem(getGlobalSettingsKey());
  if (!lsData) return defaultSettings;

  return { ...defaultSettings, ...(JSON.parse(lsData) as Partial<Settings>) };
}

function saveGlobalSettings() {
  localStorage.setItem(getGlobalSettingsKey(), JSON.stringify(store.settings));
}

createEffect(() => {
  if (store.settings) saveGlobalSettings();
});

createEffect(() => {
  if (store.gameMetaData && store.gameConfig) saveGameSettings();
});
