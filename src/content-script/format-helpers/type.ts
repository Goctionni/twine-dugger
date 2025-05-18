import { Diff, ObjectValue, Value } from '../util/types';

export interface FormatHelpers {
  detect: () => boolean;
  getPassage: () => string;
  getState: (sanitized?: boolean) => ObjectValue;
  setState: (path: Array<string | number>, value: unknown) => void;
  getDiffer: () => (clonedOldValue: Value, liveNewValue: Value) => Diff[];
}
