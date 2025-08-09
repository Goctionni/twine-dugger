import { Diff, ObjectValue, Path, ProcessDiffResult, Value } from '@/shared/shared-types';

export interface FormatHelpers {
  detect: () => boolean;
  getPassage: () => string;
  getState: (sanitized?: boolean) => ObjectValue;
  setState: (path: Path, value: unknown) => void;
  duplicateStateProperty: (
    parentPath: Path,
    sourceKey: string | number,
    targetKey?: string | null,
  ) => void;
  deleteFromState: (path: Path) => void;
  getDiffer: () => (clonedOldValue: Value, liveNewValue: Value) => Diff[];
  processDiffs?: (diffs: Diff[]) => ProcessDiffResult;
  setStatePropertyLock: (path: Path, lock: boolean) => Path[];
}
