import { Accessor, createEffect, createSignal, onCleanup } from 'solid-js';
import { DiffFrame, Path } from '@/shared/shared-types';
import { getUpdates, setStatePropertyLock } from '../utils/api';
import { getDiffLogPollingInterval } from '../stores/settingsStore';

type Result = [
  Accessor<DiffFrame[]>,
  {
    clearDiffFrames: () => void;
    getLockedPaths: () => Path[];
    addLockPath: (path: Path) => void;
    removeLockPath: (path: Path) => void;
  },
];

export function trackDiffFrames(kill: () => void): Result {
  const [diffFrames, setDiffFrames] = createSignal<DiffFrame[]>([]);
  const [getPaths, setPaths] = createSignal<Path[]>([]);
  let interval = 0;

  createEffect(() => {
    const pollingInterval = getDiffLogPollingInterval();

    interval = setInterval(() => {
      const date = new Date();
      getUpdates()
        .then((result) => {
          if (!result) return;
          const { diffPackage, locksUpdate } = result;
          if (locksUpdate) setPaths(locksUpdate);
          if (diffPackage) {
            const { diffs, passage } = diffPackage;

            const lastFrame = diffFrames()[0] as DiffFrame | undefined;
            if (!diffs?.length) {
              if (!lastFrame) return;
              if (passage === lastFrame.passage) return;
            }
            setDiffFrames([
              { timestamp: date, passage, changes: diffs },
              ...diffFrames().slice(0, 50),
            ]);
          }
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

  const addLockPath = (path: Path) => {
    setStatePropertyLock(path, true).then((paths) => setPaths(paths));
  };
  const removeLockPath = (path: Path) => {
    setStatePropertyLock(path, false).then((paths) => setPaths(paths));
  };

  return [
    diffFrames,
    {
      clearDiffFrames: () => setDiffFrames([]),
      getLockedPaths: getPaths,
      addLockPath,
      removeLockPath,
    },
  ];
}
