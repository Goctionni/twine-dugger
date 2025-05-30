import { createSignal, onCleanup } from 'solid-js';
import { DiffFrame } from '@/shared/shared-types';
import { getDiffs } from '../utils/api';

export function trackDiffFrames() {
  const [diffFrames, setDiffFrames] = createSignal<DiffFrame[]>([]);

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
  }, 200);

  onCleanup(() => clearInterval(interval));

  return diffFrames;
}
