import type { Delta } from 'jsondiffpatch';
import { patch } from 'jsondiffpatch';
import { createEffect, createMemo, createSignal, createStore, snapshot, untrack } from 'solid-js';

import { trimToExistingPath } from '@/shared/json-safe';
import { getAllowedValue } from '@/shared/lock-value';
import { pathEquals, pathKey } from '@/shared/path-equals';
import type { DeltaUpdate, JSONSafeObject, LockRevert, Path } from '@/shared/shared-types';

import { sameItems } from '../utils/same-items';
import type { BlockedWrite, DiffChange, StateDiff } from '../views/DiffLog/diff-types';
import { getDiffFromDelta } from './diff-from-delta';
import { isHiddenInDiffLog, setViewState, store } from './store';

// The state of the game is patched with the deltas that the content script sends, so that only the
// properties that actually changed notify their readers.
const [gameState, setGameState] = createStore<JSONSafeObject>({});

// The history is the diffs, newest first. Frame N is what the state
// became by diff N. The initial state is 0.
const [frames, setFrames] = createSignal<StateDiff[]>([]);
const [latestId, setLatestId] = createSignal(0);
// Goes up with every change of the state, also one that has no frame (see applyUpdate)
const [stateVersion, setStateVersion] = createSignal(0);
const [logStartId, setLogStartId] = createSignal(0);
const [lastChanged, setLastChanged] = createStore<Record<string, number>>({});

const getMaxFrames = () => untrack(() => store.settings['diffLog.maxHistorySlices']);

export const getLatestId = latestId;
export const getStateVersion = stateVersion;
export const getLatestState = () => gameState;
export const getLastChangeIdByKey = (key: string) => lastChanged[key] ?? 0;
export const getLastChangeId = (path: Path) => getLastChangeIdByKey(pathKey(path));

export type PathChange = Exclude<DiffChange, { kind: 'mov' }>;

export interface PathRecord {
  /** Newest first. The changes that are still in the diff log window */
  changes: { id: number; timestamp: number; change: PathChange }[];
  /** Including the changes that left the window */
  count: number;
  lastId: number;
  lastTimestamp: number;
}

// Not reactive: whoever reads it depends on `getLastChangeId` and `getLatestId`. In order of last
// change, so that the records that are not used anymore are at the front.
const records = new Map<string, PathRecord>();
const RECORD_MAX_AGE = 1000;

export const getPathRecord = (path: Path) => records.get(pathKey(path));

function resetView() {
  setLastChanged(() => ({}));
  records.clear();
}

function recordChanges(delta: Delta, id: number, timestamp: number) {
  for (const change of getDiffFromDelta(delta)) {
    if (change.kind === 'mov' || untrack(() => isHiddenInDiffLog(change.path))) continue;

    const key = pathKey(change.path);
    const record = records.get(key) ?? {
      changes: [],
      count: 0,
      lastId: id,
      lastTimestamp: timestamp,
    };
    record.changes.unshift({ id, timestamp, change });
    record.count++;
    record.lastId = id;
    record.lastTimestamp = timestamp;
    records.delete(key);
    records.set(key, record);
  }

  for (const [key, record] of records) {
    if (record.lastId >= id - RECORD_MAX_AGE) break;
    records.delete(key);
  }
}

// The frames that left the diff log window, oldest first: their changes leave the records too
function dropFrames(removed: StateDiff[]) {
  for (const frame of removed) {
    for (const change of getDiffFromDelta(frame.delta)) {
      if (change.kind === 'mov') continue;
      const { changes } = records.get(pathKey(change.path)) ?? {};
      if (changes?.at(-1)?.id === frame.id) changes.pop();
    }
  }
}

const getViewPath = () => untrack(() => store.viewState.state.path);

// The game can remove the value that the State view has selected: the view keeps what is left
function trimViewPath(path: Path, trimmed: Path) {
  if (trimmed.length < path.length) setViewState('state', 'path', trimmed);
}

export function startGameState(state: JSONSafeObject) {
  const path = getViewPath();
  setGameState(() => state);
  trimViewPath(path, trimToExistingPath(state, path));
  setFrames([]);
  setLatestId(0);
  setStateVersion((version) => version + 1);
  setLogStartId(0);
  resetView();
}

/**
 * The state after the game was reloaded. There's no delta from the old state to the new one, so
 * the log is kept, but it's marked where the game was reloaded, and what is before it is
 * "tainted".
 */
export function restartGameState(state: JSONSafeObject, passage: string) {
  const path = getViewPath();
  setGameState(() => state);
  trimViewPath(path, trimToExistingPath(state, path));
  resetView();
  setStateVersion((version) => version + 1);
  addFrame({ timestamp: Date.now(), passage, blocked: [], reloaded: true });
}

export function applyUpdate({ passage, delta, reverts }: DeltaUpdate, timestamp = Date.now()) {
  const blocked = reverts.flatMap(toBlockedWrite);
  if (!delta && !blocked.length) return;

  if (delta) {
    const path = getViewPath();
    let trimmed = path;
    // Staged writes: the patched state is only to be seen from inside the setter
    setGameState((draft) => {
      patch(draft, delta);
      trimmed = trimToExistingPath(draft, path);
    });
    trimViewPath(path, trimmed);
  }
  setStateVersion((version) => version + 1);

  // A change that is only to ignored paths is not worth a frame.
  // The state updates and the path is marked as changed with the id that the next frame will have.
  if (delta && !blocked.length && untrack(() => isIgnoredOnly(delta))) {
    markChanged(delta, untrack(latestId) + 1);
    return;
  }
  addFrame({ timestamp, passage, delta, blocked });
}

const isIgnoredOnly = (delta: Delta) =>
  getDiffFromDelta(delta).every((change) => isHiddenInDiffLog(change.path));

function toBlockedWrite({ path, attempted }: LockRevert): BlockedWrite[] {
  const lock = untrack(() => store.gameConfig.locks.find((lock) => pathEquals(lock.path, path)));
  if (!lock) return [];
  return [{ path, attempted, locked: snapshot(getAllowedValue(attempted, lock)) }];
}

function addFrame(frame: Omit<StateDiff, 'id'>) {
  const id = untrack(latestId) + 1;
  markChanged(frame.delta, id);
  recordChanges(frame.delta, id, frame.timestamp);
  setFrames((current) => {
    const frames = [{ ...frame, id }, ...current];
    const max = getMaxFrames();
    dropFrames(frames.slice(max).reverse());
    return frames.slice(0, max);
  });
  setLatestId(id);
}

function markChanged(delta: Delta, id: number) {
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

const getReloadId = createMemo(() => frames().find((frame) => frame.reloaded)?.id);

export const isFrameTainted = (frame: StateDiff) => frame.id < (getReloadId() ?? -Infinity);

export const getDiffFrames = createMemo(() => frames().filter((frame) => frame.id > logStartId()), {
  equals: sameItems,
});

/** Call once from a component: effects need an owner to be disposed with */
export function createFrameLimitEffect() {
  createEffect(
    () => store.settings['diffLog.maxHistorySlices'],
    (max) => {
      setFrames((current) => {
        dropFrames(current.slice(max).reverse());
        return current.slice(0, max);
      });
    },
  );
}
