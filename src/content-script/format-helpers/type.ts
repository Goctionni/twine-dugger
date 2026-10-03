import type { FormatPassage, ObjectValue, PassageData, Path } from '@/shared/shared-types';

export interface FormatHelpers {
  detect: () => boolean;
  getPassage: () => string;
  getRawState: () => ObjectValue;
  setState: (path: Path, value: unknown) => void;
  duplicateStateProperty: (
    parentPath: Path,
    sourceKey: string | number,
    targetKey?: string | null,
  ) => void;
  deleteFromState: (path: Path) => void;
  goToPassage: (passageName: string) => void;
  setPassage: (passage: FormatPassage) => void;
  getPassageData?: () => PassageData[];
}
