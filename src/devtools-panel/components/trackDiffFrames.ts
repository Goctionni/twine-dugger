import { createEffect, createSignal, onCleanup } from 'solid-js';
import { DiffFrame } from '@/shared/shared-types';
import { getDiffs } from '../utils/api';
import { getDiffLogPollingInterval } from '../stores/settingsStore';

export function trackDiffFrames() {
  const [diffFrames, setDiffFrames] = createSignal<DiffFrame[]>([]);

  createEffect(() => {
    const pollingInterval = getDiffLogPollingInterval();

    const interval = setInterval(() => {
      const date = new Date();
      getDiffs().then((result) => {
        if (!result) return;
        const { diffs, passage } = result;

        const lastFrame = diffFrames()[0] as DiffFrame | undefined;
        if (!diffs?.length) {
          if (!lastFrame) return;
          if (passage === lastFrame.passage) return;
        }
        setDiffFrames([{ timestamp: date, passage, changes: diffs }, ...diffFrames()]);
      });
    }, pollingInterval);

    return () => clearInterval(interval);
  });

  return diffFrames;
}
