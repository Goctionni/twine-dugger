import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import type { ArrowKey } from '../Shared/arrow-keys';
import type { TreeRow } from './logic/get-tree-rows';

interface Options {
  selectedPath: Path;
  /** The rows as shown */
  rows: readonly TreeRow[];
  /** Whether the container at a path has rows to open */
  canOpen: (path: Path) => boolean;
  onSelect: (path: Path) => void;
  expansion: { expand: (id: string) => void; collapse: (id: string) => void };
}

interface ListOptions extends Options {
  /** The container whose values are listed: the selected one, or the one that holds the selected value */
  listedPath: Path;
  /** The keys of the values of a container, in the order that the list shows them */
  getValueKeys: (containerPath: Path) => ReadonlyArray<string | number>;
}

function findRow(selectedPath: Path, rows: readonly TreeRow[]) {
  const index = rows.findIndex((row) => pathEquals(row.path, selectedPath));
  const next = rows[index + 1];
  const row = rows[index];
  // The row after an open container is one of its own
  const isOpen = row !== undefined && next !== undefined && next.level > row.level;
  return { index, row, next, isOpen };
}

/**
 * An arrow key in the tree that holds all the values. Up and down go to the row above and below.
 * Left closes the selected container when it is open, else goes to what holds it. Right opens the
 * selected container when it is closed, else goes to its first row. With nothing selected, down
 * goes to the first row.
 */
export function onTreeOnlyArrowKey(
  key: ArrowKey,
  { selectedPath, rows, canOpen, onSelect, expansion }: Options,
) {
  const { index, row, next, isOpen } = findRow(selectedPath, rows);

  switch (key) {
    case 'ArrowDown':
      if (next) onSelect(next.path);
      return;
    case 'ArrowUp':
      if (index > 0) onSelect(rows[index - 1]!.path);
      return;
    case 'ArrowLeft':
      if (!row) return;
      if (isOpen) expansion.collapse(row.id);
      else onSelect(selectedPath.slice(0, -1));
      return;
    case 'ArrowRight':
      if (!row || !canOpen(row.path)) return;
      if (isOpen) onSelect(next!.path);
      else expansion.expand(row.id);
      return;
  }
}

/**
 * An arrow key in the tree with the values of a container in a list beside it. When a value of
 * the list is selected, up and down go through the list and left goes back to its container.
 * With a container selected the keys are those of the tree, except right: once there is nothing
 * left to open it goes to the first value of the container.
 */
export function onTreeListArrowKey(key: ArrowKey, options: ListOptions) {
  const { selectedPath, rows, canOpen, listedPath, getValueKeys, onSelect } = options;

  const isValueSelected = !pathEquals(listedPath, selectedPath);
  if (isValueSelected) {
    const container = selectedPath.slice(0, -1);
    const valueKeys = getValueKeys(listedPath);
    const index = valueKeys.indexOf(selectedPath.at(-1)!);

    if (key === 'ArrowDown' && index >= 0 && index < valueKeys.length - 1) {
      onSelect([...container, valueKeys[index + 1]!]);
    } else if (key === 'ArrowUp' && index > 0) {
      onSelect([...container, valueKeys[index - 1]!]);
    } else if (key === 'ArrowLeft') {
      onSelect(container);
    }
    return;
  }

  if (key === 'ArrowRight') {
    const { row, isOpen } = findRow(selectedPath, rows);
    const hasRowsToOpen = row !== undefined && canOpen(row.path) && !isOpen;
    const firstValueKey = getValueKeys(selectedPath)[0];
    if (!hasRowsToOpen && firstValueKey !== undefined) {
      onSelect([...selectedPath, firstValueKey]);
      return;
    }
  }
  onTreeOnlyArrowKey(key, options);
}
