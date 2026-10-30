import { getDiffFromDelta } from '../../store/diff-from-delta';
import { isHiddenInDiffLog } from '../../store/store';
import type { StateDiff } from './diff-types';

export function getVisibleEntries(frame: StateDiff) {
  return {
    changes: getDiffFromDelta(frame.delta).filter((change) => !isHiddenInDiffLog(change.path)),
    blocked: frame.blocked.filter((write) => !isHiddenInDiffLog(write.path)),
  };
}

export function hasVisibleEntries(frame: StateDiff) {
  const { changes, blocked } = getVisibleEntries(frame);
  return !!frame.reloaded || changes.length > 0 || blocked.length > 0;
}
