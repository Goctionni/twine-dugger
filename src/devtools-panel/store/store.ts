import { create as createDiffer } from 'jsondiffpatch';
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  createStore,
  deep,
  snapshot,
  untrack,
} from 'solid-js';

import { pathEquals, pathStartsWith } from '@/shared/path-equals';
import type {
  GameMetaData,
  JSONSafeObject,
  ParsedPassageData,
  PassageData,
  Path,
  UpdateResult,
} from '@/shared/shared-types';

import { getPassageData as apiGetPassageData } from '../api/api';
import type { DiffChange } from './delta';
import { flattenDelta } from './delta';
import type { GameConfig, Settings, StateDiff, StoreData } from './store-types';

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
    const lsData = localStorage.getItem(getGlobalSettingsKey());
    if (lsData) return { ...defaultSettings, ...(JSON.parse(lsData) as Partial<Settings>) };
  } catch {}
  return { ...defaultSettings };
}

function loadGameConfig(ifId: string | undefined): GameConfig {
  const config: GameConfig = { filteredPaths: [], lockedPaths: [] };
  if (!ifId) return config;
  try {
    const lsData = localStorage.getItem(getGameSettingsKey(ifId));
    // Locks are not restored: they only exist for as long as the content script remembers them
    if (lsData)
      config.filteredPaths = (JSON.parse(lsData) as Partial<GameConfig>).filteredPaths ?? [];
  } catch {}
  return config;
}

// --- State ---------------------------------------------------------------------------------------
//
// `store` holds everything that is edited in place: settings, view state, config.
// `gameState` is a store of its own: it is patched with the deltas the content script sends, so
// only the properties that actually changed notify their readers.
//
// The diff history is a signal of immutable frames rather than a store: nothing ever edits a frame,
// and the frames are what the state history is rebuilt from.

const [store, setStore] = createStore<StoreData>({
  connectionState: 'loading-meta',
  candidateIframes: [],
  gameMeta: null,
  gameConfig: { filteredPaths: [], lockedPaths: [] },
  settings: loadGlobalSettings(),
  viewState: {
    activeTab: 'state',
    state: { historyRef: 'latest', path: [] },
    passage: { selected: null },
    search: { query: '', resultTab: 'state' },
  },
});

const [gameState, setGameState] = createStore<JSONSafeObject>({});

/** Newest first. Consecutive ids; id N is the state after diff N (0 is the initial state) */
const [frames, setFrames] = createSignal<StateDiff[]>([]);
const [latestId, setLatestId] = createSignal(0);
/** The diff log only shows frames newer than this; the history is not affected by clearing it */
const [logStartId, setLogStartId] = createSignal(0);
/** Path -> id of the last frame that changed it (or something below it) */
const [lastChanged, setLastChanged] = createStore<Record<string, number>>({});

const [getPassageData, setPassageData] = createSignal<ParsedPassageData[]>([]);
export { getPassageData, setPassageData };

const differ = createDiffer({ arrays: { detectMove: true, includeValueOnMove: false } });

const pathKey = (path: Path) => path.join('\u0000');

// --- Applying updates ----------------------------------------------------------------------------

export function resetGameState(initialState: JSONSafeObject) {
  setGameState(() => initialState);
  setFrames([]);
  setLatestId(0);
  setLogStartId(0);
  setLastChanged(() => ({}));
  setViewState('state', 'historyRef', 'latest');
}

export function applyUpdate({ passage, delta }: UpdateResult, timestamp = Date.now()) {
  if (!delta) return;

  const id = untrack(latestId) + 1;
  let changes: DiffChange[] = [];
  // The patch inserts values from the delta into the store; the frame keeps the pristine delta
  const patch = structuredClone(delta);
  setGameState((draft) => {
    differ.patch(draft, patch);
    changes = flattenDelta(delta, draft);
  });

  setLastChanged((draft) => {
    for (const { path } of changes) {
      for (let i = 1; i <= path.length; i++) draft[pathKey(path.slice(0, i))] = id;
    }
  });

  const frame: StateDiff = { id, timestamp, passage, delta, changes };
  const max = untrack(() => store.settings['diffLog.maxHistorySlices']);
  setFrames((current) => [frame, ...current].slice(0, max));
  setLatestId(id);
}

// --- Derived state -------------------------------------------------------------------------------

const shallowEqual = <T>(a: T[], b: T[]) => a.length === b.length && a.every((v, i) => v === b[i]);

const derived = createRoot(() => {
  /** The state as it was after the diff with id `historyRef`, rebuilt by undoing newer diffs */
  const historicalState = createMemo(() => {
    const ref = store.viewState.state.historyRef;
    if (ref === 'latest') return null;

    // Only `historyRef` is tracked: new frames don't change what an older slice looks like
    return untrack(() => {
      const state = structuredClone(snapshot(gameState));
      for (const frame of frames()) {
        if (frame.id <= ref) break;
        differ.unpatch(state, structuredClone(frame.delta));
      }
      return state;
    });
  });

  const getActiveState = (): JSONSafeObject => historicalState() ?? gameState;

  /** Ids of every state that can be inspected, latest first */
  const getHistoryIds = createMemo(
    () => {
      const latest = latestId();
      return Array.from({ length: frames().length + 1 }, (_, i) => latest - i);
    },
    { equals: shallowEqual },
  );

  const getDiffFrames = createMemo(() => frames().filter((frame) => frame.id > logStartId()), {
    equals: shallowEqual,
  });

  // The oldest slice can go away when frames are trimmed
  createEffect(
    () => ({ oldest: latestId() - frames().length, ref: store.viewState.state.historyRef }),
    ({ oldest, ref }) => {
      if (ref !== 'latest' && ref < oldest) setViewState('state', 'historyRef', 'latest');
    },
  );

  createEffect(
    () => store.settings['diffLog.maxHistorySlices'],
    (max) => {
      setFrames((current) => current.slice(0, max));
    },
  );

  createEffect(
    () => deep(store.settings),
    (settings) => {
      localStorage.setItem(getGlobalSettingsKey(), JSON.stringify(settings));
    },
  );

  createEffect(
    () => ({ ifId: store.gameMeta?.ifId, config: deep(store.gameConfig) }),
    ({ ifId, config }) => {
      if (ifId) localStorage.setItem(getGameSettingsKey(ifId), JSON.stringify(config));
    },
  );

  return { getActiveState, getHistoryIds, getDiffFrames };
});

export const { getActiveState, getHistoryIds, getDiffFrames } = derived;
export const getLatestId = latestId;
/** The live state, regardless of which history slice is being inspected */
export const getLatestState = () => gameState;
export const getLastChangeId = (path: Path) => lastChanged[pathKey(path)] ?? 0;

export function clearDiffFrames() {
  setLogStartId(untrack(latestId));
}

// --- Connection & meta ---------------------------------------------------------------------------

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

// --- Navigation & view state ---------------------------------------------------------------------

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

// --- Settings ------------------------------------------------------------------------------------

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

// --- Filtered paths & locks ----------------------------------------------------------------------

export const getFilteredPaths = () => store.gameConfig.filteredPaths;
export const getLockedPaths = () => store.gameConfig.lockedPaths;

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

export const addLockPath = (path: Path) =>
  setStore((draft) => {
    const { lockedPaths } = draft.gameConfig;
    if (!lockedPaths.some((current) => pathEquals(current, path))) lockedPaths.push([...path]);
  });

export const removeLockPath = (path: Path) =>
  setStore((draft) => {
    draft.gameConfig.lockedPaths = draft.gameConfig.lockedPaths.filter(
      (current) => !pathEquals(current, path),
    );
  });

export const clearLockPaths = () =>
  setStore((draft) => {
    draft.gameConfig.lockedPaths = [];
  });

// --- Passages ------------------------------------------------------------------------------------

function parseDoubleIntAttr(str: string) {
  return str.split(',').map(Number) as [number, number];
}

export function parsePassage(passage: PassageData): ParsedPassageData {
  return {
    id: parseInt(passage.pid),
    name: passage.name,
    size: passage.size ? parseDoubleIntAttr(passage.size) : null,
    position: passage.position ? parseDoubleIntAttr(passage.position) : null,
    content: passage.content,
    tags: passage.tags?.split(' ').filter(Boolean),
  };
}

export const getSelectedPassage = () => {
  const name = store.viewState.passage.selected;
  if (name === null) return null;
  return getPassageData().find((passage) => passage.name === name) ?? null;
};

export const reloadPassagesData = async () => {
  const passageData = await apiGetPassageData();
  setPassageData(passageData.map(parsePassage));
};
