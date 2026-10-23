import { setState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { getSettings } from '@/devtools-panel/store/store';
import { createOptimisticWithTimeout } from '@/devtools-panel/utils/create-optimistic-with-timeout';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

/**
 * The value at a path, for an editor to show and set. What is set shows at once, and stays until
 * the state has it (the game is polled, so that is a moment later). If the state does not get
 * there in time (the game did not take it, or a lock put it back), the value goes back to what the
 * state has. Moving to another path, or another value at the path, also ends the wait.
 * A write is ignored while the one before it is still waiting; the third value tells when that is.
 */
export function createEditableValue<T extends boolean | number | string>(getPath: () => Path) {
  // Setting the same path again reads nothing new, so it does not end the wait
  const getStablePath = createStablePath(getPath);

  return createOptimisticWithTimeout<T>(
    () => getPathValue(getLatestState(), getStablePath()) as T,
    (value) => setState(getStablePath(), value),
    // A poll away, and a second for the call and the game to answer
    () => getSettings.diffLog.pollingInterval() + 1000,
  );
}
