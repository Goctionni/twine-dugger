import type { JSONSafeObject } from '@/shared/shared-types';

import { getPassageData, getState, getUpdates } from '../api/api';
import { applyUpdate, restartGameState, startGameState } from './game-state';
import { syncLocks } from './locks';
import { parsePassage, setPassageData } from './passages';
import { createGetSetting, setConnectionState } from './store';

const getPollingInterval = createGetSetting('diffLog.pollingInterval');

/**
 * Loads the state and the passages, and hands the locks to the content script. When the game was
 * reloaded the locks that the content script had are gone, so they have to be handed over again.
 */
async function load(setGameState: (state: JSONSafeObject) => void) {
  // One after the other: the first call injects the content script, which takes the diff baseline
  const game = await getState();
  if (!game) throw new Error('Could not read the game state');
  const passageData = await getPassageData();

  setGameState(game.state);
  setPassageData(passageData.map(parsePassage));
  await syncLocks();
}

/** Loads the state, then polls the content script for changes. Returns a function that stops. */
export async function startTrackingFrames() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  setConnectionState('loading-game');

  try {
    await load(startGameState);
    setConnectionState('live');

    const poll = async () => {
      const started = Date.now();
      try {
        const update = await getUpdates();
        if (stopped) return;
        if (update?.initialized) await load(restartGameState);
        else if (update) applyUpdate(update, started);
      } catch {
        setConnectionState('error');
        return;
      }
      timeout = setTimeout(poll, Math.max(0, getPollingInterval() - (Date.now() - started)));
    };
    timeout = setTimeout(poll, getPollingInterval());
  } catch {
    setConnectionState('error');
  }

  return () => {
    stopped = true;
    clearTimeout(timeout);
  };
}
