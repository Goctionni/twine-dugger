import { getLastChangeId, getLatestId } from '@/devtools-panel/store/game-state';
import { getSettings } from '@/devtools-panel/store/store';
import type { Path } from '@/shared/shared-types';

/** The value, or something inside it, changed in one of the last few updates */
export function isRecentlyChanged(path: Path): boolean {
  const lastChangeId = getLastChangeId(path);
  return lastChangeId > 0 && getLatestId() - lastChangeId < getSettings.state.recentUpdates();
}
