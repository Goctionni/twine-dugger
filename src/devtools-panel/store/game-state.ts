import type { Delta } from 'jsondiffpatch';
import { create as createDiffer } from 'jsondiffpatch';
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  createStore,
  snapshot,
  untrack,
} from 'solid-js';

import { pathEquals } from '@/shared/path-equals';
import type { JSONSafeObject, LockRevert, Path, UpdateResult } from '@/shared/shared-types';

import { sameItems } from '../utils/same-items';
import { getDiffFromDelta } from './diff';
import { setViewState, store } from './store';
import type { BlockedWrite, StateDiff } from './store-types';

// The state of the game is patched with the deltas that the content script sends, so that only the
// properties that actually changed notify their readers.
const [gameState, setGameState] = createStore<JSONSafeObject>({});

// The history is the diffs, newest first. Frame N is what the state became by diff N, so an older
// state is found by undoing the diffs after it. The initial state is 0.
const [frames, setFrames] = createSignal<StateDiff[]>([]);
const [latestId, setLatestId] = createSignal(0);
/** Clearing the diff log only hides frames, the history is still there */
const [logStartId, setLogStartId] = createSignal(0);
/** Path -> the id of the last frame that changed it or something below it */
const [lastChanged, setLastChanged] = createStore<Record<string, number>>({});

const differ = createDiffer({ arrays: { detectMove: true, includeValueOnMove: false } });
const pathKey = (path: Path) => path.join('\u0000');
const getMaxFrames = () => untrack(() => store.settings['diffLog.maxHistorySlices']);

export const getLatestId = latestId;
/** The live state, whichever slice of the history is being looked at */
export const getLatestState = () => gameState;
export const getLastChangeId = (path: Path) => lastChanged[pathKey(path)] ?? 0;

// --- Changing the state

function resetView() {
  setLastChanged(() => ({}));
  setViewState('state', 'historyRef', 'latest');
}

/** The state of a game that was just opened: there's no history yet */
export function startGameState(state: JSONSafeObject) {
  setGameState(() => state);
  setFrames([]);
  setLatestId(0);
  setLogStartId(0);
  resetView();
}

/**
 * The state after the game was reloaded. There's no delta from the old state to the new one, so
 * the log is kept, but it's marked where the game was reloaded and what is before it (which is
 * "tainted") can't be travelled to anymore.
 */
export function restartGameState(state: JSONSafeObject) {
  setGameState(() => state);
  resetView();
  addFrame({ timestamp: Date.now(), passage: '', blocked: [], reloaded: true });
}

export function applyUpdate({ passage, delta, reverts }: UpdateResult, timestamp = Date.now()) {
  const blocked = reverts.flatMap(toBlockedWrite);
  if (!delta && !blocked.length) return;

  if (delta) {
    // The patch puts values from the delta in the state, which are changed later on. The frame
    // keeps the original delta.
    const patch = structuredClone(delta);
    setGameState((draft) => {
      differ.patch(draft, patch);
    });
  }
  addFrame({ timestamp, passage, delta, blocked });
}

/** A lock that was removed while the update was on its way has nothing to report */
function toBlockedWrite({ path, attempted }: LockRevert): BlockedWrite[] {
  const lock = untrack(() => store.gameConfig.locks.find((lock) => pathEquals(lock.path, path)));
  return lock ? [{ path, attempted, locked: snapshot(lock.value) }] : [];
}

function addFrame(frame: Omit<StateDiff, 'id'>) {
  const id = untrack(latestId) + 1;
  markChanged(frame.delta, id);
  setFrames((current) => [{ ...frame, id }, ...current].slice(0, getMaxFrames()));
  setLatestId(id);
}

function markChanged(delta: Delta | undefined, id: number) {
  setLastChanged((draft) => {
    for (const { path } of getDiffFromDelta(delta)) {
      for (let length = 1; length <= path.length; length++) {
        draft[pathKey(path.slice(0, length))] = id;
      }
    }
  });
}

export function clearDiffFrames() {
  setLogStartId(untrack(latestId));
}

// --- What the views look at

const derived = createRoot(() => {
  /** The state as it was after the diff with id `historyRef`, made by undoing the newer diffs */
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

  /** The frame that marks the last time the game was reloaded, if it's still in the history */
  const getReloadId = createMemo(() => frames().find((frame) => frame.reloaded)?.id);

  /** Frames from before the last reload can be read in the log, but their states are out of reach */
  const isFrameTainted = (frame: StateDiff) => frame.id < (getReloadId() ?? -Infinity);

  /** The oldest state that can be looked at: the one after the last reload, or before the oldest frame */
  const getHistoryFloor = createMemo(() =>
    Math.max(getReloadId() ?? -Infinity, latestId() - frames().length),
  );

  /** The ids of the states that can be looked at, latest first */
  const getHistoryIds = createMemo(
    () => {
      const latest = latestId();
      return Array.from({ length: latest - getHistoryFloor() + 1 }, (_, i) => latest - i);
    },
    { equals: sameItems },
  );

  const getDiffFrames = createMemo(() => frames().filter((frame) => frame.id > logStartId()), {
    equals: sameItems,
  });

  // The slice that is looked at can go away when frames are trimmed
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

  return { getActiveState, getHistoryIds, getDiffFrames, isFrameTainted };
});

export const { getActiveState, getHistoryIds, getDiffFrames, isFrameTainted } = derived;
