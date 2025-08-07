import { Diff, ObjectValue, Path, Value } from '@/shared/shared-types';

export interface FormatHelpers {
  detect: () => boolean;
  getPassage: () => string;
  getState: (sanitized?: boolean) => ObjectValue;
  setState: (path: Path, value: unknown) => void;
  duplicateStateProperty: (
    parentPath: Path,
    sourceKey: string | number,
    targetKey?: string,
  ) => void;
  deleteFromState: (path: Path) => void;
  getDiffer: () => (clonedOldValue: Value, liveNewValue: Value) => Diff[];
}
