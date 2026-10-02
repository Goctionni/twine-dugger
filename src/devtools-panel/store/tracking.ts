import type { InitUpdate } from '@/shared/shared-types';

import { getPassageData, getUpdates } from '../api/api';
import { applyUpdate, restartGameState, startGameState } from './game-state';
import { syncLocks } from './locks';
import { parsePassage, setPassageData } from './passages';
import { createGetSetting, setConnectionState } from './store';

const getPollingInterval = createGetSetting('diffLog.pollingInterval');

async function load({ state, passage }: InitUpdate, isReload: boolean) {
  const passageData = await getPassageData();

  if (isReload) restartGameState(state, passage);
  else startGameState(state);
  setPassageData(passageData.map(parsePassage));
  await syncLocks();
}

export async function startTrackingFrames() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  setConnectionState('loading-game');

  try {
    const first = await getUpdates(true);
    if (first?.type !== 'init') throw new Error('Could not read the game state');
    await load(first, false);
    setConnectionState('live');

    const poll = async () => {
      const started = Date.now();
      try {
        const update = await getUpdates();
        if (stopped) return;
        if (update?.type === 'init') await load(update, true);
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
