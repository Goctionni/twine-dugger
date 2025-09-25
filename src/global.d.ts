import { JSX } from 'solid-js/types/jsx.d.ts';

import { Diff, ObjectValue, PassageData, Path, UpdateResult } from '@/shared/shared-types';

declare module 'solid-js/types/jsx.d.ts' {
  namespace JSX {
    interface DialogHtmlAttributes<T> extends JSX.HTMLAttributes<T> {
      closedby: 'any' | 'closerequest' | 'none';
    }
  }
}

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
  declare const scheduler: Scheduler;

  interface Window {
    Harlowe: {
      API_ACCESS: {
        STATE: {
          variables: ObjectValue;
          passage: string;
        };
      };
    };
    SugarCube: {
      Config: {
        passages: {
          start: string;
        };
        history: {
          controls: boolean;
          maxStates: number;
        };
        saves?: {
          maxSlotSaves?: number;
        };
      };
      Save: {
        browser?: {
          slot?: {
            size?: number;
          };
        };
        slots: {
          length: number;
          count(): number;
        };
      };
      State: {
        variables: ObjectValue;
        passage: string;
      };
      Story: {
        name: string;
        title: string;
        get ifId(): string;
      };
      storage: {
        name: string;
      };
      version: {
        major: number;
        minor: number;
        patch: number;
        build: number;
        long(): string;
        short(): string;
        toString(): string;
      };
    };
    TwineDugger: {
      getPassageData: () => PassageData[];
      getUpdates: () => UpdateResult;
      getState: () => { passage: string; state: ObjectValue };
      setState: (path: Path, value: unknown) => void;
      deleteFromState: (path: Path) => void;
      duplicateStateProperty: (
        parentPath: Path,
        sourceKey: string | number,
        targetKey?: string | null,
      ) => void;
      setStatePropertyLock: (path: Path, lock: boolean) => Path[];
      setStatePropertyLocks: (paths: Path[]) => void;
      utils: {
        jsonReplacer(key: string, value: any): any;
        jsonReviver(key: string, value: any): any;
      };
    };
  }
  interface ErrorConstructor {
    isError(value: unknown): value is Error;
  }
}
