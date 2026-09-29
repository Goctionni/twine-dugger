import { getDiffFromDelta } from '../../store/diff';
import { isPathFiltered } from '../../store/store';
import type { StateDiff } from '../../store/store-types';

/** What a frame in the diff log shows: its changes and its blocked writes, except the filtered ones */
export function getVisibleEntries(frame: StateDiff) {
  return {
    changes: getDiffFromDelta(frame.delta).filter((change) => !isPathFiltered(change.path)),
    blocked: frame.blocked.filter((write) => !isPathFiltered(write.path)),
  };
}

export function hasVisibleEntries(frame: StateDiff) {
  const { changes, blocked } = getVisibleEntries(frame);
  return !!frame.reloaded || changes.length > 0 || blocked.length > 0;
}
