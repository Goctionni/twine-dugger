import type { InitUpdate } from '@/shared/shared-types';

import { getPassageData, getUpdates } from '../api/api';
import { applyUpdate, restartGameState, startGameState } from './game-state';
import { syncLocks } from './locks';
import { parsePassage, setPassageData } from './passages';
import { getSettings, setConnectionState } from './store';

const ERROR_WINDOW_MS = 60_000;
const MAX_ERRORS_IN_WINDOW = 2;

async function load({ state, passage }: InitUpdate, isReload: boolean) {
  const passageData = await getPassageData();

  if (isReload) restartGameState(state, passage);
  else startGameState(state);
  setPassageData(passageData.map(parsePassage));
  await syncLocks();
}

export async function startTrackingFrames() {
  let timeout = 0;
  let stopped = false;
  setConnectionState('loading-game');

  try {
    const first = await getUpdates(true);
    if (first?.type !== 'init') throw new Error('Could not read the game state');
    await load(first, false);
    setConnectionState('live');

    let recentErrors: number[] = [];
    let needsFullSync = false;

    const recordErrorAndGetCount = (timestamp: number) => {
      recentErrors.push(timestamp);
      recentErrors = recentErrors.filter((at) => timestamp - at < ERROR_WINDOW_MS);
      return recentErrors.length;
    };

    const poll = async () => {
      const started = Date.now();
      try {
        const update = await getUpdates(needsFullSync);
        if (stopped) return;
        if (update?.type === 'init') await load(update, true);
        else if (update) applyUpdate(update, started);
        needsFullSync = false;
      } catch {
        if (stopped) return;

        if (recordErrorAndGetCount(started) > MAX_ERRORS_IN_WINDOW) {
          return setConnectionState('error');
        } else {
          // After an error we need a full resync, but we don't
          // bail until a few errors have occured.
          needsFullSync = true;
        }
      }
      const elapsed = Date.now() - started;
      const delay = Math.max(0, getSettings.diffLog.pollingInterval() - elapsed);
      timeout = setTimeout(poll, delay);
    };
    poll();
  } catch {
    setConnectionState('error');
  }

  return () => {
    stopped = true;
    clearTimeout(timeout);
  };
}
