import { Diff, ObjectValue, Value } from '@/shared/shared-types';

export interface FormatHelpers {
  detect: () => boolean;
  getPassage: () => string;
  getState: (sanitized?: boolean) => ObjectValue;
  setState: (path: Array<string | number>, value: unknown) => void;
  deleteFromState: (path: Array<string | number>) => void;
  getDiffer: () => (clonedOldValue: Value, liveNewValue: Value) => Diff[];
}
