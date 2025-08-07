import { Diff, ObjectValue } from './content-script/util/types';
import { JSX } from 'solid-js/types/jsx.d.ts';

declare module 'solid-js/types/jsx.d.ts' {
  namespace JSX {
    interface DialogHtmlAttributes<T> extends JSX.HTMLAttributes<T> {
      closedby: 'any' | 'closerequest' | 'none';
    }
  }
}

declare global {
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
      getDiffs: () => { passage: string; diffs: Diff[] };
      getState: () => { passage: string; state: ObjectValue };
      setState: (path: Array<string | number>, value: unknown) => void;
      deleteFromState: (path: Array<string | number>) => void;
      duplicateStateProperty: (
        parentPath: Path,
        sourceKey: string | number,
        targetKey?: string,
      ) => void;
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
