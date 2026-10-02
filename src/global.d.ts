import '@types/firefox-webext-browser';
import '@types/chrome';
import type {
  FormatPassage,
  Lock,
  JSONSafeValue,
  ObjectValue,
  PassageData,
  Path,
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
      getUpdates: (full?: boolean) => UpdateResult;
      setState: (path: Path, value: unknown) => void;
      deleteFromState: (path: Path) => void;
      duplicateStateProperty: (
        parentPath: Path,
        sourceKey: string | number,
        targetKey?: string | null,
      ) => void;
      setStatePropertyLocks: (locks: Lock[]) => void;
      goToPassage: (passageName: string) => void;
      setPassage: (passage: FormatPassage) => void;
    };
  }
  interface ErrorConstructor {
    isError(value: unknown): value is Error;
  }
}
