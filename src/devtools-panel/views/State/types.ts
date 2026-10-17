export type Navigator = 'miller' | 'tree' | 'tiles';
export type SelectionKind = 'container' | 'primitive';

export interface NavProps {
  /** The path of the selected value, without the root */
  path: string[];
  selectionKind: SelectionKind;
}
