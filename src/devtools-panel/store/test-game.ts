import { createUpdateTracker } from '@/content-script/util/update-tracker';
import type { DeltaUpdate } from '@/shared/shared-types';

export function createGame(live: Record<string, any>) {
  const tracker = createUpdateTracker(() => live);

  return {
    live,
    state: () => structuredClone(tracker.reset()),
    update: (): DeltaUpdate => ({
      type: 'update',
      passage: 'P',
      delta: tracker.getDelta(),
      reverts: [],
    }),
  };
}
