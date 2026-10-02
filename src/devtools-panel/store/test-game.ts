import { createUpdateTracker } from '@/content-script/util/update-tracker';
import type { UpdateResult } from '@/shared/shared-types';

export function createGame(live: Record<string, any>) {
  const tracker = createUpdateTracker(() => live);

  return {
    live,
    state: () => structuredClone(tracker.getState()),
    update: (): UpdateResult => ({
      passage: 'P',
      delta: tracker.getDelta(),
      reverts: [],
      initialized: false,
    }),
  };
}
