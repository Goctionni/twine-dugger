import { snapshot } from 'solid-js';

import { getLastChangeIdByKey, getLatestId, getLatestState } from '../../store/game-state';
import { getPassageData } from '../../store/passages';
import type { SearchData } from '../types';

/** The game that is being inspected */
export const gameData: SearchData = {
  passages: getPassageData,
  stateVersion: getLatestId,
  getState: () => snapshot(getLatestState()),
  getLastChange: getLastChangeIdByKey,
};
