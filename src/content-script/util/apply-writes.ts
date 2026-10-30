import type { Path, Write, WriteResult } from '@/shared/shared-types';

import { posttransformValue } from './post-transform';

interface Target {
  setState: (path: Path, value: unknown) => void;
  deleteFromState: (path: Path) => void;
}

/**
 * Runs the writes one after the other, in one go, so the game does not run in between. A write that
 * fails does not stop the ones after it. The order is the caller's: a delete moves the items of an
 * array after it.
 */
export function applyWrites(writes: Write[], target: Target): WriteResult[] {
  return writes.map((write): WriteResult => {
    try {
      if ('delete' in write) {
        target.deleteFromState(write.path);
      } else {
        target.setState(write.path, posttransformValue(write.value, { deep: write.deep }));
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
