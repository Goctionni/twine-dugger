import { Show, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { getPathValue, isContainer } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { NavRow } from '../Shared/NavRow';
import type { createTreeExpansion } from './create-tree-expansion';
import type { TreeRow as TreeRowData } from './logic/get-tree-rows';
import { getRowDomId } from './logic/row-dom-id';

interface Props {
  /** The id of the tree that the row is in: the id of the row is made from it */
  treeId: string;
  row: TreeRowData;
  selectedPath: Path;
  /** The container whose values are in the list beside the tree. Without a list, nothing */
  listedPath?: Path;
  /** Whether the container at a path has rows to open */
  canOpen: (path: Path) => boolean;
  expansion: ReturnType<typeof createTreeExpansion>;
  onSelect: (path: Path) => void;
}

// A new level starts one icon width (20px) and 4px further in: the icon of a row is 4px past the
// icon of the row above, and its caret (16px, then 1px, then the 5px of border and padding of the
// row before its icon) is centred under that icon
const INDENT_PER_LEVEL = 24;
const ROW_PADDING = 6;

export function TreeRow(props: Props) {
  // The path of a row is a new array whenever the rows are worked out again
  const getPath = createStablePath(() => props.row.path);
  const isContainerRow = () => isContainer(getPathValue(getLatestState(), getPath()));
  const canOpen = createMemo(() => props.canOpen(getPath()));
  const isOpen = () => props.expansion.isExpanded(props.row.id);

  // Only the selected row is marked: the rows above it are the way to it, not part of it. When
  // the selection is a value in the list, the container that holds it is marked quietly
  const getSelectionState = () => {
    if (pathEquals(props.selectedPath, getPath())) return 'selected';
    return props.listedPath && pathEquals(props.listedPath, getPath()) ? 'on-path' : 'normal';
  };

  // A container opens when it is clicked, and closes when it is clicked again while it is selected
  const onClick = () => {
    if (isContainerRow()) {
      if (getSelectionState() === 'selected' && isOpen()) props.expansion.collapse(props.row.id);
      else props.expansion.expand(props.row.id);
    }
    props.onSelect(getPath());
  };

  // The caret and the indent are outside of the row: what is marked as selected starts at the icon
  return (
    <div
      role="none"
      class="flex items-center"
      style={{ 'padding-left': `${ROW_PADDING + (props.row.level - 1) * INDENT_PER_LEVEL}px` }}
    >
      {/* Rows that cannot be opened keep the room of the caret, so that the icons of a level line up */}
      <span class="mr-px inline-grid h-4 w-4 shrink-0 place-items-center">
        <Show when={canOpen()}>
          <span
            title={isOpen() ? 'Close' : 'Open'}
            class="material-symbols-outlined inline-grid h-4 w-4 cursor-pointer place-items-center rounded-sm text-base leading-none text-white hover:bg-gray-700"
            onClick={() => props.expansion.toggle(props.row.id)}
          >
            {isOpen() ? 'expand_more' : 'chevron_right'}
          </span>
        </Show>
      </span>
      <NavRow
        id={getRowDomId(props.treeId, props.row.id)}
        path={getPath()}
        isExpanded={isOpen()}
        selectionState={getSelectionState()}
        onClick={onClick}
        class="pl-1"
      />
    </div>
  );
}
