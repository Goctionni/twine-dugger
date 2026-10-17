import { For, Show, createEffect, createMemo } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { getRevealCount } from '@/devtools-panel/store/state-location';
import { sameItems } from '@/devtools-panel/utils/same-items';
import {
  getContainerKeys,
  getContainerSize,
  getJsonType,
  getKeyLabel,
  getPathValue,
  isContainer,
  isContainerType,
} from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { JSONSafeObject, JSONSafeValue, Path } from '@/shared/shared-types';

import { countHiddenKeys, filterKeysByType } from '../logic/filter-keys';
import { getPathLabels } from '../logic/path-labels';
import { getPreview } from '../logic/preview';
import { getKeysByName, sortKeysByChanged, sortKeysByType } from '../logic/sort-keys';
import { getHiddenTypes, getSort } from '../store-helpers/view-prefs';
import { NavRow } from './NavRow';

interface Props {
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
  const getContainerType = createMemo(() => {
    const type = getJsonType(getContainer());
    return isContainerType(type) ? type : undefined;
  });

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
    () => {
      const type = getContainerType();
      if (!type) return [];
      const sort = getSort();
      const getTypeOf = (key: string | number) => getJsonType(getChild(getContainer(), key));

      const keys = filterKeysByType(
        sort === 'name' ? getKeysByName(getContainer()) : getContainerKeys(getContainer(), type),
        getTypeOf,
        getHiddenTypes(),
      );
      // The position is the name of an item of an array or a set
      if (type === 'array' || type === 'set' || sort === 'name') return keys;
      if (sort === 'changed') {
        return sortKeysByChanged(keys, (key) => getLastChangeId([...getColumnPath(), key]));
      }
      return sortKeysByType(keys, getTypeOf);
    },
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

          return (
            <NavRow
              name={String(getKeyLabel(getContainerType()!, key))}
              type={getType()}
              preview={getPreview(getValue(), getType())}
              childCount={getChildCount()}
              hiddenCount={getHiddenChildren()}
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
