import { getPassageData, getState, getUpdates } from '../api/api';
import {
  applyUpdate,
  createGetSetting,
  parsePassage,
  resetGameState,
  setConnectionState,
  setPassageData,
} from './store';

const getPollingInterval = createGetSetting('diffLog.pollingInterval');

/** Loads the initial state, then polls the content script for changes. Returns a stop function. */
export async function startTrackingFrames() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  setConnectionState('loading-game');

  try {
    // Sequential: the first call injects the content script, which takes the diff baseline
    const initialState = await getState();
    if (!initialState) throw new Error('Could not read the game state');
    const passageData = await getPassageData();

    resetGameState(initialState.state);
    setPassageData(passageData.map(parsePassage));
    setConnectionState('live');

    const poll = async () => {
      const started = Date.now();
      try {
        const update = await getUpdates();
        if (stopped) return;
        if (update) applyUpdate(update, started);
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
