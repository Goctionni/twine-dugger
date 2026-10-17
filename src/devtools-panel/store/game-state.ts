import type { Delta } from 'jsondiffpatch';
import { patch } from 'jsondiffpatch';
import { createEffect, createMemo, createSignal, createStore, snapshot, untrack } from 'solid-js';

import { pathEquals, pathKey } from '@/shared/path-equals';
import type { DeltaUpdate, JSONSafeObject, LockRevert, Path } from '@/shared/shared-types';

import { sameItems } from '../utils/same-items';
import type { BlockedWrite, StateDiff } from '../views/DiffLog/diff-types';
import { getDiffFromDelta } from './diff-from-delta';
import { store } from './store';

// The state of the game is patched with the deltas that the content script sends, so that only the
// properties that actually changed notify their readers.
const [gameState, setGameState] = createStore<JSONSafeObject>({});

// The history is the diffs, newest first. Frame N is what the state
// became by diff N. The initial state is 0.
const [frames, setFrames] = createSignal<StateDiff[]>([]);
const [latestId, setLatestId] = createSignal(0);
const [logStartId, setLogStartId] = createSignal(0);
const [lastChanged, setLastChanged] = createStore<Record<string, number>>({});

const getMaxFrames = () => untrack(() => store.settings['diffLog.maxHistorySlices']);

export const getLatestId = latestId;
export const getLatestState = () => gameState;
export const getLastChangeIdByKey = (key: string) => lastChanged[key] ?? 0;
export const getLastChangeId = (path: Path) => getLastChangeIdByKey(pathKey(path));

function resetView() {
  setLastChanged(() => ({}));
}

export function startGameState(state: JSONSafeObject) {
  setGameState(() => state);
  setFrames([]);
  setLatestId(0);
  setLogStartId(0);
  resetView();
}

/**
 * The state after the game was reloaded. There's no delta from the old state to the new one, so
 * the log is kept, but it's marked where the game was reloaded, and what is before it is
 * "tainted".
 */
export function restartGameState(state: JSONSafeObject, passage: string) {
  setGameState(() => state);
  resetView();
  addFrame({ timestamp: Date.now(), passage, blocked: [], reloaded: true });
}

export function applyUpdate({ passage, delta, reverts }: DeltaUpdate, timestamp = Date.now()) {
  const blocked = reverts.flatMap(toBlockedWrite);
  if (!delta && !blocked.length) return;

  if (delta) {
    setGameState((draft) => {
      patch(draft, delta);
    });
  }
  addFrame({ timestamp, passage, delta, blocked });
}

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
      setFrames((current) => current.slice(0, max));
    },
  );
}
