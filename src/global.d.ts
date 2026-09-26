import '@types/firefox-webext-browser';
import '@types/chrome';
import type { Delta } from 'jsondiffpatch';

import type {
  FormatPassage,
  JSONSafeObject,
  JSONSafeValue,
  ObjectValue,
  PassageData,
  Path,
  TooltipValue,
  UpdateResult,
} from '@/shared/shared-types';

type SchedulerTask<T> = () => T | Promise<T>;
type TaskOptions = {
  priority?: 'user-blocking' | 'user-visible' | 'background';
  signal?: AbortSignal;
  delay?: number;
};
interface Scheduler {
  postTask<T = unknown>(task: SchedulerTask<T>, options?: TaskOptions): Promise<T>;
  yield(): Promise<void>;
}

declare global {
  interface Window {
    TwineDugger: {
      getPassageData: () => PassageData[];
      getUpdates: () => Delta;
      getState: () => { passage: string; state: JSONSafeObject };
      setState: (path: Path, value: unknown) => void;
      deleteFromState: (path: Path) => void;
      duplicateStateProperty: (
        parentPath: Path,
        sourceKey: string | number,
        targetKey?: string | null,
      ) => void;
      setStatePropertyLock: (path: Path, lock: boolean) => Path[];
      setStatePropertyLocks: (paths: Path[]) => void;
      goToPassage: (passageName: string) => void;
      setPassage: (passage: FormatPassage) => void;
    };
  }
  interface ErrorConstructor {
    isError(value: unknown): value is Error;
  }
}

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      tooltip: TooltipValue;
    }
  }
}
