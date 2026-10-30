import type { Path } from '@/shared/shared-types';

export type Navigator = 'miller' | 'tree' | 'tiles';
export type SelectionKind = 'container' | 'primitive';
export type SortBy = 'name' | 'type' | 'changed';
export interface Sort {
  by: SortBy;
  /** The order of the sort turned around (the items of an array and a set keep their positions) */
  isDescending: boolean;
}

export interface NavProps {
  /** The path of the selected value, without the root */
  path: Path;
  onSelect: (path: Path) => void;
}
