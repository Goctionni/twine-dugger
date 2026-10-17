import type { Path } from '@/shared/shared-types';

export type Navigator = 'miller' | 'tree' | 'tiles';
export type SelectionKind = 'container' | 'primitive';
export type Sort = 'name' | 'type' | 'changed';

export interface NavProps {
  /** The path of the selected value, without the root */
  path: Path;
  selectionKind: SelectionKind;
  onSelect: (path: Path) => void;
  /** Whether the inspector covers the navigator, when the view is too small for it to sit beside or below it */
  isOverlayOpen: boolean;
  onCloseOverlay: () => void;
}
