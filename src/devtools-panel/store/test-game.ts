import { createUpdateTracker } from '@/content-script/util/update-tracker';
import type { UpdateResult } from '@/shared/shared-types';

/** A game for tests: it changes its live state, and its updates are made the way the content script does */
export function createGame(live: Record<string, any>) {
  const tracker = createUpdateTracker(() => live);

  return {
    live,
    /** The state that the panel is given to start with */
    state: () => structuredClone(tracker.getState()),
    update: (): UpdateResult => ({
      passage: 'P',
      delta: tracker.getDelta(),
      reverts: [],
      initialized: false,
    }),
  };
}
