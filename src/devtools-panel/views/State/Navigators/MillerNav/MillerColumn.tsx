import { For, Show, createEffect, createMemo } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { getScrollToTrigger } from '@/devtools-panel/store/state-location';
import { isPinned } from '@/devtools-panel/store/store';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getContainerSize, getPathValue, isContainer } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import { NavRow } from '../Shared/NavRow';
import { getVisibleKeys } from '../Shared/visible-keys';
import { getRowId } from './logic/row-id';

interface Props {
  /** The id of the tree that the column is in: the ids of the rows are made from it */
  treeId: string;
  depth: number;
  path: Path;
  trail: Path;
  onSelect: (path: Path) => void;
}

export function MillerColumn(props: Props) {
  // Each of these only notifies when its own result changes, so a new selection leaves the columns
  // before it alone, and a changed value leaves everything but the rows that show it alone
  const getColumnPath = createMemo(() => props.path.slice(0, props.depth), { equals: pathEquals });
  const getContainer = createMemo(() => getPathValue(getLatestState(), getColumnPath()));

  const getSelectedKey = createMemo(() => props.path[props.depth]);
  const isSelectionHere = () => props.depth === props.path.length - 1;
  const getTrailKey = createMemo(() => props.trail[props.depth]);

  // Also when the column is made: coming back to the page shows what was selected
  let column: HTMLDivElement | undefined;
  createEffect(getScrollToTrigger, () => {
    column
      ?.querySelector('[data-selection-state="selected"], [data-selection-state="on-path"]')
      ?.scrollIntoView({ block: 'nearest' });
  });

  const getKeys = createMemo(
    () =>
      getVisibleKeys(
        getContainer(),
        getSort(),
        getHiddenTypes(),
        (key) => getLastChangeId([...getColumnPath(), key]),
        (key) => isPinned([...getColumnPath(), key]),
      ),
    { equals: sameItems },
  );

  const getTitle = () => getPathLabels(getLatestState(), getColumnPath()).at(-1) ?? 'State';

  const getHiddenCount = () => {
    const container = getContainer();
    return isContainer(container) ? getContainerSize(container) - getKeys().length : 0;
  };

  return (
    <div
      ref={column}
      role="group"
      aria-label={getTitle()}
      tabindex="-1"
      class="min-w-57.5 flex-1 basis-57.5 overflow-y-auto border-r border-gray-700 p-1 not-last:max-w-86.25 last:border-r-0"
    >
      <div class="sticky top-0 truncate bg-gray-900 px-2 py-1 font-mono text-xs text-gray-400">
        {getTitle()}
        <Show when={getHiddenCount() > 0}>
          <span class="text-amber-400"> · {getHiddenCount()} hidden</span>
        </Show>
      </div>
      <For each={getKeys()}>
        {(key) => {
          const getSelectionState = () => {
            if (getSelectedKey() === key) return isSelectionHere() ? 'selected' : 'on-path';
            return getTrailKey() === key ? 'trail' : 'normal';
          };

          return (
            <NavRow
              id={getRowId(props.treeId, props.depth, key)}
              path={[...getColumnPath(), key]}
              isExpanded={getSelectionState() === 'on-path' || getSelectionState() === 'selected'}
              selectionState={getSelectionState()}
              onClick={() =>
                props.onSelect(
                  getSelectionState() === 'selected' ? getColumnPath() : [...getColumnPath(), key],
                )
              }
            />
          );
        }}
      </For>
    </div>
  );
}
