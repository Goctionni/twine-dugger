import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import type { ArrowKey } from '../../Shared/arrow-keys';
import type { TreeRow } from './get-tree-rows';

export type TreeKeyAction =
  | { type: 'select'; path: Path }
  | { type: 'expand' | 'collapse'; id: string };

/**
 * What an arrow key does in the tree, or nothing. Up and down go to the row above and below.
 * Left closes the selected container when it is open, else goes to what holds it. Right opens the
 * selected container when it is closed, else goes to its first row. With nothing selected, down
 * goes to the first row. `rows` are the rows as shown, `hasChildren` tells whether a row has
 * rows to open.
 */
export function getTreeKeyAction(
  key: ArrowKey,
  selectedPath: Path,
  rows: readonly TreeRow[],
  hasChildren: (row: TreeRow) => boolean,
): TreeKeyAction | undefined {
  const index = rows.findIndex((row) => pathEquals(row.path, selectedPath));
  const row = rows[index];
  const next = rows[index + 1];
  // The row after an open container is one of its own
  const isOpen = row !== undefined && next !== undefined && next.level > row.level;

  switch (key) {
    case 'ArrowDown':
      return next && { type: 'select', path: next.path };
    case 'ArrowUp':
      return index > 0 ? { type: 'select', path: rows[index - 1]!.path } : undefined;
    case 'ArrowLeft':
      if (!row) return undefined;
      return isOpen
        ? { type: 'collapse', id: row.id }
        : { type: 'select', path: selectedPath.slice(0, -1) };
    case 'ArrowRight':
      if (!row || !hasChildren(row)) return undefined;
      return isOpen ? { type: 'select', path: next.path } : { type: 'expand', id: row.id };
  }
}
