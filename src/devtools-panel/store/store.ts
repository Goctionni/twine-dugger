import { create as createDiffer } from 'jsondiffpatch';
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  createStore,
  deep,
  flush,
  snapshot,
  untrack,
} from 'solid-js';

import { containsFunction, getPathValue } from '@/shared/json-safe';
import { pathEquals, pathStartsWith } from '@/shared/path-equals';
import type {
  GameMetaData,
  JSONSafeObject,
  JSONSafeValue,
  Lock,
  LockRevert,
  ParsedPassageData,
  PassageData,
  Path,
  UpdateResult,
} from '@/shared/shared-types';

import { getPassageData as apiGetPassageData, setStatePropertyLocks } from '../api/api';
import type { DiffChange } from './delta';
import { flattenDelta, getPathKinds } from './delta';
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
  const config: GameConfig = { filteredPaths: [], locks: [] };
  if (!ifId) return config;
  try {
    const lsData = localStorage.getItem(getGameSettingsKey(ifId));
    if (lsData) {
      const saved = JSON.parse(lsData) as Partial<GameConfig>;
      config.filteredPaths = saved.filteredPaths ?? [];
      config.locks = saved.locks ?? [];
    }
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
  gameConfig: { filteredPaths: [], locks: [] },
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

/**
 * `reloaded`: the game restarted underneath us. The log is kept, with a marker where it happened.
 * There's no delta from the old state to the new one, so what came before the marker can still be
 * read in the log (it's "tainted") but can no longer be travelled to.
 */
export function resetGameState(initialState: JSONSafeObject, reloaded = false) {
  setGameState(() => initialState);
  setLastChanged(() => ({}));
  setViewState('state', 'historyRef', 'latest');

  if (!reloaded) {
    setFrames([]);
    setLatestId(0);
    setLogStartId(0);
    return;
  }

  const id = untrack(latestId) + 1;
  const changes: DiffChange[] = [{ kind: 'reload', path: [], kinds: [] }];
  const marker: StateDiff = { id, timestamp: Date.now(), passage: '', changes };
  const max = untrack(() => store.settings['diffLog.maxHistorySlices']);
  setFrames((current) => [marker, ...current].slice(0, max));
  setLatestId(id);
}

function createLockChange(revert: LockRevert, state: unknown): DiffChange[] {
  const lock = untrack(() => store.gameConfig.locks.find((l) => pathEquals(l.path, revert.path)));
  if (!lock) return [];

  const { path, attempted } = revert;
  return [
    {
      kind: 'lock',
      path,
      kinds: getPathKinds(state, path),
      attempted,
      locked: snapshot(lock.value),
    },
  ];
}

export function applyUpdate({ passage, delta, reverts }: UpdateResult, timestamp = Date.now()) {
  let changes: DiffChange[] = [];
  // The patch inserts values from the delta into the store; the frame keeps the pristine delta
  const patch = delta && structuredClone(delta);
  setGameState((draft) => {
    if (delta) {
      differ.patch(draft, patch!);
      changes = flattenDelta(delta, draft);
    }
    changes.push(...reverts.flatMap((revert) => createLockChange(revert, draft)));
  });
  if (!changes.length && !delta) return;

  // A game that keeps fighting a lock repeats the same revert every poll: count those instead
  const previous = untrack(frames)[0];
  if (
    !delta &&
    previous &&
    !previous.delta &&
    JSON.stringify(previous.changes) === JSON.stringify(changes)
  ) {
    setFrames((current) => [
      { ...previous, passage, timestamp, repeats: (previous.repeats ?? 1) + 1 },
      ...current.slice(1),
    ]);
    return;
  }

  const id = untrack(latestId) + 1;
  setLastChanged((draft) => {
    for (const { kind, path } of changes) {
      if (kind === 'lock') continue;
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
        if (frame.delta) differ.unpatch(state, structuredClone(frame.delta));
      }
      return state;
    });
  });

  const getActiveState = (): JSONSafeObject => historicalState() ?? gameState;

  /** Id of the frame that marks the last time the game was reloaded, if it is still in the log */
  const getReloadId = createMemo(
    () => frames().find((frame) => frame.changes.some((change) => change.kind === 'reload'))?.id,
  );

  /** The oldest state that can be inspected: after the last reload, or before the oldest frame */
  const getHistoryFloor = createMemo(() =>
    Math.max(getReloadId() ?? -Infinity, latestId() - frames().length),
  );

  /** Ids of every state that can be inspected, latest first */
  const getHistoryIds = createMemo(
    () => {
      const latest = latestId();
      return Array.from({ length: latest - getHistoryFloor() + 1 }, (_, i) => latest - i);
    },
    { equals: shallowEqual },
  );

  /** Frames from before the last reload are in the log, but their states can't be reached anymore */
  const isFrameTainted = (frame: StateDiff) => frame.id < (getReloadId() ?? -Infinity);

  const getDiffFrames = createMemo(() => frames().filter((frame) => frame.id > logStartId()), {
    equals: shallowEqual,
  });

  // The oldest slice can go away when frames are trimmed
  createEffect(
    () => ({ floor: getHistoryFloor(), ref: store.viewState.state.historyRef }),
    ({ floor, ref }) => {
      if (ref !== 'latest' && ref < floor) setViewState('state', 'historyRef', 'latest');
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

  return { getActiveState, getHistoryIds, getDiffFrames, isFrameTainted };
});

export const { getActiveState, getHistoryIds, getDiffFrames, isFrameTainted } = derived;
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
export const getLockedPaths = () => store.gameConfig.locks.map((lock) => lock.path);

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

// A lock is a path and the value the path is kept at. The panel decides the value, so restoring a
// lock after the game reloaded is the same call as setting one.

const getLatestValue = (path: Path) => untrack(() => snapshot(getPathValue(gameState, path)));
const currentLocks = (): Lock[] => untrack(() => snapshot(store.gameConfig.locks));

/** Whether the value at the path (as it is now) can be locked: functions can't be sent back */
export function isPathLockable(path: Path) {
  const value = getLatestValue(path);
  return value !== undefined && !containsFunction(value);
}

function setLocks(locks: Lock[]) {
  setStore((draft) => {
    draft.gameConfig.locks = locks;
  });
  // Applied right away, so the next change to the locks starts from this list
  flush();
  return setStatePropertyLocks(locks);
}

/** Sends the locks to the content script, for instance after it was reinitialized */
export const syncLocks = () => setStatePropertyLocks(currentLocks());

export function setPathLock(path: Path, lock: boolean) {
  const locks = currentLocks().filter((current) => !pathEquals(current.path, path));
  if (lock) {
    const value = getLatestValue(path);
    if (value === undefined) throw new Error('Cannot lock a path that has no value');
    if (containsFunction(value))
      throw new Error('Cannot lock a value that is or contains a function');
    locks.push({ path: [...path], value: structuredClone(value) as JSONSafeValue });
  }
  return setLocks(locks);
}

export const clearLocks = () => setLocks([]);

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
