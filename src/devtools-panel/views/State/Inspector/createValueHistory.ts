import { createMemo } from 'solid-js';

import { getLastChangeId, getLatestId, getPathRecord } from '@/devtools-panel/store/game-state';
import type { Path } from '@/shared/shared-types';

import { getValueHistory, sameHistory } from './logic/value-history';

export function createValueHistory(getPath: () => Path) {
  return createMemo(
    () => {
      // The record is not reactive. A change of the path, or a frame leaving the log window, is
      // what changes it
      getLastChangeId(getPath());
      getLatestId();
      return getValueHistory(getPathRecord(getPath()));
    },
    { equals: sameHistory },
  );
}
