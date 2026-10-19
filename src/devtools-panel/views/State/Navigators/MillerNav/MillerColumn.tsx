import { For, Show, createEffect, createMemo } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { getRevealCount } from '@/devtools-panel/store/state-location';
import { isPinned } from '@/devtools-panel/store/store';
import { sameItems } from '@/devtools-panel/utils/same-items';
import {
  getContainerKeyLabel,
  getContainerSize,
  getJsonType,
  getPathValue,
  isContainer,
} from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { JSONSafeObject, JSONSafeValue, Path } from '@/shared/shared-types';

import { countHiddenKeys } from '../../logic/filter-keys';
import { getPathLabels } from '../../logic/path-labels';
import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import { NavRow } from '../Shared/NavRow';
import { getPreview } from '../Shared/preview';
import { isRecentlyChanged } from '../Shared/recently-changed';
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

const getChild = (container: JSONSafeValue, key: string | number) =>
  (container as JSONSafeObject)[key];

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
  createEffect(getRevealCount, () => {
    column
      ?.querySelector('[data-state="selected"], [data-state="on-path"]')
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

  const getRowName = (key: string | number) => {
    const container = getContainer();
    return isContainer(container) ? getContainerKeyLabel(container, key) : String(key);
  };

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
          const getValue = () => getChild(getContainer(), key);
          const getType = createMemo(() => getJsonType(getValue()));
          const getRowState = () => {
            if (getSelectedKey() === key) return isSelectionHere() ? 'selected' : 'on-path';
            return getTrailKey() === key ? 'trail' : 'normal';
          };
          const getHiddenChildren = () => countHiddenKeys(getValue(), getHiddenTypes());
          const getChildCount = () => {
            const value = getValue();
            return isContainer(value) ? getContainerSize(value) - getHiddenChildren() : undefined;
          };
          const getIsExpanded = () => {
            const count = getChildCount();
            if (count === undefined) return undefined;
            return getRowState() === 'on-path' || (getRowState() === 'selected' && count > 0);
          };

          return (
            <NavRow
              id={getRowId(props.treeId, props.depth, key)}
              level={props.depth + 1}
              isExpanded={getIsExpanded()}
              name={getRowName(key)}
              type={getType()}
              preview={getPreview(getValue(), getType())}
              childCount={getChildCount()}
              hiddenCount={getHiddenChildren()}
              isRecentlyChanged={isRecentlyChanged([...getColumnPath(), key])}
              state={getRowState()}
              onClick={() =>
                props.onSelect(
                  getRowState() === 'selected' ? getColumnPath() : [...getColumnPath(), key],
                )
              }
            />
          );
        }}
      </For>
    </div>
  );
}
