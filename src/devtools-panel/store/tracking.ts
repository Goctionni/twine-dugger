import { getPassageData, getState, getUpdates } from '../api/api';
import {
  applyUpdate,
  createGetSetting,
  parsePassage,
  resetGameState,
  setConnectionState,
  setPassageData,
  syncLocks,
} from './store';

const getPollingInterval = createGetSetting('diffLog.pollingInterval');

/**
 * Loads the state and passages, and hands the locks to the content script.
 * Also what to do when the content script says it was just initialized: the game was reloaded,
 * so what we have is stale and the locks it enforced are gone.
 */
async function load(reloaded: boolean) {
  // Sequential: the first call injects the content script, which takes the diff baseline
  const state = await getState();
  if (!state) throw new Error('Could not read the game state');
  const passageData = await getPassageData();

  resetGameState(state.state, reloaded);
  setPassageData(passageData.map(parsePassage));
  await syncLocks();
}

/** Loads the initial state, then polls the content script for changes. Returns a stop function. */
export async function startTrackingFrames() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  setConnectionState('loading-game');

  try {
    await load(false);
    setConnectionState('live');

    const poll = async () => {
      const started = Date.now();
      try {
        const update = await getUpdates();
        if (stopped) return;
        if (update?.initialized) await load(true);
        else if (update) applyUpdate(update, started);
      } catch {
        return setConnectionState('error');
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
