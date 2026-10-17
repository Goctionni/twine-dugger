import type { Path } from '@/shared/shared-types';

export type Navigator = 'miller' | 'tree' | 'tiles';
export type SelectionKind = 'container' | 'primitive';
export type Sort = 'name' | 'type' | 'changed';

export interface NavProps {
  /** The path of the selected value, without the root */
  path: Path;
  selectionKind: SelectionKind;
  onSelect: (path: Path) => void;
}
