import { createSignal, createEffect, onCleanup } from 'solid-js';
import { DiffFrame } from '@/shared/shared-types';
import { getDiffs } from '../utils/api';
import { getDiffLogPolling } from './Settings/State/State';

export function trackDiffFrames() {
  const [diffFrames, setDiffFrames] = createSignal<DiffFrame[]>([]);
  const diffLogPolling = getDiffLogPolling();

  let interval: number | undefined;

  createEffect(() => {
    if (interval !== undefined) {
      clearInterval(interval);
    }

    interval = setInterval(() => {
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
    }, diffLogPolling());
  });

  onCleanup(() => {
    if (interval !== undefined) {
      clearInterval(interval);
    }
  });

  return diffFrames;
}
