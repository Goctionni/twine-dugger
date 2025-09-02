import { Accessor, batch, createEffect, createMemo, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

import { pathEquals } from '@/shared/path-equals';
import {
  ConnectionState,
  DiffFrame,
  GameMetaData,
  Page,
  ParsedPassageData,
  PassageData,
  Path,
  PropertyOrder,
  StateFrame,
} from '@/shared/shared-types';

import {
  getPassageData as apiGetPassageData,
  getState as apiGetState,
  getUpdates,
  setStatePropertyLocks,
} from '../api/api';
import { applyDiffsToState } from './apply-diffs';

const LS_PREFIX = 'twine-dugger-';
const getGameSettingsKey = (ifId: string) => `${LS_PREFIX}${ifId}`;
const getGlobalSettingsKey = () => `${LS_PREFIX}settings`;

interface GameConfig {
  lockedPaths: Path[];
  filteredPaths: Path[];
}

interface Settings {
  'diffLog.fontSize': number;
  'diffLog.pollingInterval': number;
  'diffLog.headingStyle': 'default' | 'distinct';
  'state.propertyOrder': PropertyOrder;
}

interface Store {
  connection: ConnectionState;
  candidateIframes?: string[];
  gameMetaData: GameMetaData | null;

  navigation: {
    page: Page;
  };
  viewState: {
    state: {
      historyId: number;
      path: Path;
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
  connection: 'loading-meta',
  gameConfig: null,
  gameMetaData: null,
  navigation: {
    page: 'state',
  },
  viewState: {
    passage: {
      selected: null,
    },
    search: {
      query: '',
    },
    state: {
      historyId: -1,
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
export const getLockedPaths = createMemo(() => store.gameConfig?.lockedPaths ?? []);
export const getGameMetaData = createMemo(() => store.gameMetaData);

export const getLatestStateFrame = createMemo(() => getStateFrames()[0]!);

const getActiveStateFrame = createMemo(() => {
  const historyId = store.viewState.state.historyId;
  const stateFrames = getStateFrames();
  if (historyId === -1) return stateFrames[0];
  return stateFrames.find((frame) => frame.id === historyId) ?? getStateFrames()[0];
});

export const getActiveState = createMemo(() => getActiveStateFrame()?.state);

export const getHistoryIds = createMemo(() => getStateFrames().map((frame) => frame.id));

export const getNavigationPage = createMemo(() => store.navigation.page);

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

export const setCandidateIframes = (urls: string[]) => setStore('candidateIframes', urls);

export const getCandidateIframes = createMemo(() => store.candidateIframes);

export function setGameMetaData(meta: GameMetaData) {
  batch(() => {
    setStore('gameMetaData', meta);
    setStore('gameConfig', loadGameSettings());
  });
}

export const setNavigationPage = (view: Page) => {
  setStore('navigation', 'page', view);
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

export const clearFilteredPaths = () => {
  setStore('gameConfig', 'filteredPaths', []);
};

export const addLockPath = (path: Path) => {
  const current = store.gameConfig?.lockedPaths ?? [];
  if (current.some((currentPath) => pathEquals(currentPath, path))) return;
  setStore('gameConfig', 'lockedPaths', [...current, path]);
};

export const removeLockPath = (path: Path) => {
  const current = store.gameConfig?.lockedPaths ?? [];
  const newPaths = current.filter((currentPath) => !pathEquals(currentPath, path));
  setStore('gameConfig', 'lockedPaths', newPaths);
};

export const setSetting = <T extends keyof Store['settings']>(
  setting: T,
  value: Store['settings'][T],
) => {
  setStore('settings', setting, value);
};

export async function startTrackingFrames() {
  let timeout = 0;
  setConnectionState('loading-game');
  try {
    const [initialState, passageData] = await Promise.all([
      apiGetState(),
      apiGetPassageData(),
      getUpdates(), // this initializes the differ in the content script
    ]);
    if (!initialState) throw new Error();

    if (store.gameConfig?.lockedPaths) setStatePropertyLocks(store.gameConfig.lockedPaths);

    setStateFrames([{ id: 0, state: initialState.state }]);
    setPassageData(passageData.map(parsePassage));
    setDiffFrames([]);
    setConnectionState('live');

    const update = async () => {
      const timestamp = new Date();
      const updates = await getUpdates();
      if (updates) {
        const { diffPackage, locksUpdate } = updates;
        if (locksUpdate) setStore('gameConfig', 'lockedPaths', locksUpdate);
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

export function clearDiffFrames() {
  setDiffFrames([]);
}

// Utility functions
function parseDoubleIntAttr(str: string) {
  return str.split(',').map(Number) as [number, number];
}

function parsePassage(passage: PassageData): ParsedPassageData {
  return {
    id: parseInt(passage.pid),
    name: passage.name,
    size: passage.size ? parseDoubleIntAttr(passage.size) : null,
    position: passage.position ? parseDoubleIntAttr(passage.position) : null,
    content: passage.content,
    tags: passage.tags?.split(' ').filter(Boolean),
  };
}

function loadGameSettings() {
  const defaultConfig: GameConfig = { filteredPaths: [], lockedPaths: [] };
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
    ['state.propertyOrder']: 'type',
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
