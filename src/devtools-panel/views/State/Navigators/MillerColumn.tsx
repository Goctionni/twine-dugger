import { For, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
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

import { getPathLabels } from '../logic/path-labels';
import { getPreview } from '../logic/preview';
import { sortKeysByType } from '../logic/sort-keys';
import { NavRow } from './NavRow';

interface Props {
  depth: number;
  path: Path;
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

  const getKeys = createMemo(
    () => {
      const container = getContainer();
      const type = getContainerType();
      if (!type) return [];
      const keys = getContainerKeys(container, type);
      // The position is the name of an item of an array or a set
      if (type === 'array' || type === 'set') return keys;
      return sortKeysByType(keys, (key) => getJsonType(getChild(container, key)));
    },
    { equals: sameItems },
  );

  const getTitle = () => getPathLabels(getLatestState(), getColumnPath()).at(-1) ?? 'State';

  const getSelectedKey = createMemo(() => props.path[props.depth]);
  const isSelectionHere = () => props.depth === props.path.length - 1;

  return (
    <div class="min-w-57.5 flex-1 basis-57.5 overflow-y-auto border-r border-gray-700 p-1 not-last:max-w-86.25 last:border-r-0">
      <div class="sticky top-0 truncate bg-gray-900 px-2 py-1 font-mono text-xs text-gray-400">
        {getTitle()}
      </div>
      <For each={getKeys()}>
        {(key) => {
          const getValue = () => getChild(getContainer(), key);
          const getType = createMemo(() => getJsonType(getValue()));
          const getChildCount = () => {
            const value = getValue();
            return isContainer(value) ? getContainerSize(value) : undefined;
          };

          return (
            <NavRow
              name={String(getKeyLabel(getContainerType()!, key))}
              type={getType()}
              preview={getPreview(getValue(), getType())}
              childCount={getChildCount()}
              state={
                getSelectedKey() !== key ? 'normal' : isSelectionHere() ? 'selected' : 'on-path'
              }
              onClick={() => props.onSelect([...getColumnPath(), key])}
            />
          );
        }}
      </For>
    </div>
  );
}
