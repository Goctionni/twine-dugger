import { For, createEffect, createMemo } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { getRevealCount, requestReveal } from '@/devtools-panel/store/state-location';
import { isPinned } from '@/devtools-panel/store/store';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue } from '@/shared/json-safe';
import { pathEquals, pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { TYPE_ORDER } from '../../logic/sort-keys';
import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import type { NavProps } from '../../types';
import { isArrowKey } from '../Shared/arrow-keys';
import { getTypesIn } from '../Shared/get-types-in';
import { getVisibleKeys } from '../Shared/visible-keys';
import { createContainerMemos } from './create-container-memos';
import { createTreeExpansion } from './create-tree-expansion';
import { getTreeKeyAction } from './logic/get-tree-key-action';
import { getTreeRows, sameRows, type TreeRow as TreeRowData } from './logic/get-tree-rows';
import { getRowDomId } from './logic/row-dom-id';
import { provideTreeTypes } from './tree-types';
import { TreeRow } from './TreeRow';

export function TreeNav(props: NavProps) {
  const treeId = `tree-${crypto.randomUUID()}`;
  const getSelectedPath = createStablePath(() => props.path);
  const expansion = createTreeExpansion(getSelectedPath);

  const getKeysAt = createContainerMemos(
    (containerPath) =>
      getVisibleKeys(
        getPathValue(getLatestState(), containerPath),
        getSort(),
        getHiddenTypes(),
        (key) => getLastChangeId([...containerPath, key]),
        (key) => isPinned([...containerPath, key]),
      ),
    sameItems,
  );
  const getTypesAt = createContainerMemos(
    (containerPath) => getTypesIn(getPathValue(getLatestState(), containerPath)),
    sameItems,
  );

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

  // For the filter of the toolbar: the types of the values in the state itself and in the
  // containers that are open
  const getShownTypes = createMemo(
    () => {
      const found = new Set(getTypesAt([]));
      for (const row of getRows()) {
        if (expansion.isExpanded(row.id)) getTypesAt(row.path).forEach((type) => found.add(type));
      }
      return TYPE_ORDER.filter((type) => found.has(type));
    },
    { equals: sameItems },
  );
  // oxlint-disable-next-line solid/reactivity -- it is read later, by the toolbar
  provideTreeTypes(getShownTypes);

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
  );
}
