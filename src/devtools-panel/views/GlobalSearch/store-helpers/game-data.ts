import { snapshot } from 'solid-js';

import { getLastChangeIdByKey, getLatestId, getLatestState } from '../../../store/game-state';
import { getPassageData } from '../../../store/passages';

export const getPassages = getPassageData;

/** Changes whenever the state does, so that the state is searched again */
export const getStateVersion = getLatestId;

/** Reading it is not tracked: `getStateVersion` says when to look again */
export const getUntrackedState = () => snapshot(getLatestState());

/** Higher = changed more recently */
export const getLastChange = getLastChangeIdByKey;
