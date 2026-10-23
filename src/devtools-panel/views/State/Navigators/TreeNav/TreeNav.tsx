import { For, createEffect, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getRevealCount, requestReveal } from '@/devtools-panel/store/state-location';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { pathEquals, pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import type { NavProps } from '../../types';
import { NavFrame } from '../NavFrame';
import { isArrowKey } from '../Shared/arrow-keys';
import { createContainerKeys } from './create-container-keys';
import { createTreeExpansion } from './create-tree-expansion';
import { getTreeKeyAction } from './logic/get-tree-key-action';
import { getTreeRows, sameRows, type TreeRow as TreeRowData } from './logic/get-tree-rows';
import { getRowDomId } from './logic/row-dom-id';
import { TreeRow } from './TreeRow';

export function TreeNav(props: NavProps) {
  const treeId = `tree-${crypto.randomUUID()}`;
  const getSelectedPath = createStablePath(() => props.path);
  const expansion = createTreeExpansion(getSelectedPath);

  const getKeysAt = createContainerKeys();

  // A row that is still there stays the same object: only the rows that changed are worked out again
  const getRows = createMemo(
    (previous: TreeRowData[] = []) => {
      const known = new Map(previous.map((row) => [row.id, row]));
      return getTreeRows(getLatestState(), expansion.isExpanded, getKeysAt).map(
        (row) => known.get(row.id) ?? row,
      );
    },
    { equals: sameRows },
  );

  const isSelectedRowShown = createMemo(() =>
    getRows().some((row) => pathEquals(row.path, getSelectedPath())),
  );
  const getActiveId = () =>
    isSelectedRowShown() ? getRowDomId(treeId, pathKey(getSelectedPath())) : undefined;

  // A reveal is asked for (the breadcrumbs, the diff log, the keys), and also when the tree is made.
  // The row of the selection may not be there yet: its parents are opened a moment after the
  // selection is set, so the scroll waits for the row to be shown
  let tree: HTMLDivElement | undefined;
  let handledRevealCount = -1;
  let isRevealPending = false;
  createEffect(
    () => [getRevealCount(), isSelectedRowShown()] as const,
    ([revealCount, isShown]) => {
      if (revealCount !== handledRevealCount) {
        handledRevealCount = revealCount;
        isRevealPending = true;
      }
      // Nothing is selected: no row to show, and a click later is not a reveal
      if (getSelectedPath().length === 0) isRevealPending = false;
      if (!isRevealPending || !isShown) return;
      isRevealPending = false;
      tree
        ?.querySelector('[data-selection-state="selected"]')
        ?.scrollIntoView({ block: 'nearest' });
    },
  );

  const hasChildren = (row: { path: Path }) => getKeysAt(row.path).length > 0;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (!isArrowKey(event.key)) return;
    event.preventDefault();

    const action = getTreeKeyAction(event.key, getSelectedPath(), getRows(), hasChildren);
    if (action?.type === 'select') {
      props.onSelect(action.path);
      requestReveal();
    } else if (action?.type === 'expand') {
      expansion.expand(action.id);
    } else if (action?.type === 'collapse') {
      expansion.collapse(action.id);
    }
  };

  return (
    <NavFrame {...props}>
      <div
        ref={tree}
        role="tree"
        aria-label="State"
        tabindex="0"
        aria-activedescendant={getActiveId()}
        onKeyDown={onKeyDown}
        onFocusIn={(event) => {
          if (event.target !== event.currentTarget) event.currentTarget.focus();
        }}
        class="p-1 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500"
      >
        <For each={getRows()} keyed={(row) => row.id}>
          {(getRow) => (
            <TreeRow
              treeId={treeId}
              row={getRow()}
              selectedPath={getSelectedPath()}
              expansion={expansion}
              onSelect={props.onSelect}
            />
          )}
        </For>
      </div>
    </NavFrame>
  );
}
