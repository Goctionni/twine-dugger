import { Accessor, createEffect, createSignal, onCleanup } from 'solid-js';
import { DiffFrame } from '@/shared/shared-types';
import { getDiffs } from '../utils/api';
import { getDiffLogPollingInterval } from '../stores/settingsStore';

export function trackDiffFrames(kill: () => void): [Accessor<DiffFrame[]>, () => void] {
  const [diffFrames, setDiffFrames] = createSignal<DiffFrame[]>([]);
  let interval = 0;

  createEffect(() => {
    const pollingInterval = getDiffLogPollingInterval();

    interval = setInterval(() => {
      const date = new Date();
      getDiffs()
        .then((result) => {
          if (!result) return;
          const { diffs, passage } = result;

          const lastFrame = diffFrames()[0] as DiffFrame | undefined;
          if (!diffs?.length) {
            if (!lastFrame) return;
            if (passage === lastFrame.passage) return;
          }
          setDiffFrames([
            { timestamp: date, passage, changes: diffs },
            ...diffFrames().slice(0, 50),
          ]);
        })
        .catch((error) => {
          if (Error.isError(error) && error.message.includes('Extension context invalidated')) {
            clearInterval(interval);
            kill();
            return;
          }
          throw error;
        });
    }, pollingInterval);
  });

  onCleanup(() => clearInterval(interval));

  return [diffFrames, () => setDiffFrames([])];
}
