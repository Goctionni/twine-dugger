import { GameMetaData } from '@/shared/shared-types';

import { getGameMetaData } from '../api/api';
import { setCandidateIframes, setConnectionState, setGameMetaData } from '../store';

export function initMeta() {
  setConnectionState('loading-meta');
  return getGameMetaData()
    .then((meta) => {
      if (!meta) {
        setConnectionState('no-game-detected');
        return false;
      } else if ('__type' in meta && meta.__type === 'candidate-game-iframes') {
        setConnectionState('candidate-iframes');
        setCandidateIframes(meta.urls);
        return false;
      } else {
        setGameMetaData(meta as GameMetaData);
        setConnectionState('not-enabled');
        return true;
      }
    })
    .catch((ex) => {
      setConnectionState('error');
      throw ex;
    });
}
