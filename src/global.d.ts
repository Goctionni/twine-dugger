import { Diff, ObjectValue } from './content-script/util/types';

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
      };
      Save: {
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
      utils: {
        jsonReplacer(key: string, value: any): any;
        jsonReviver(key: string, value: any): any;
      };
    };
  }
}
