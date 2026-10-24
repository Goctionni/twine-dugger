import { For, Show, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import {
  getContainerKeys,
  getJsonType,
  getPathValue,
  isContainer,
  isContainerType,
} from '@/shared/json-safe';
import { pathEquals, pathKey } from '@/shared/path-equals';
import type { JSONSafeObject, Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { NavRow } from '../Shared/NavRow';
import { getRowDomId } from './logic/row-dom-id';

interface Props {
  /** The id of the tree that the list is in: the ids of the rows are made from it */
  treeId: string;
  /** The container whose values are listed */
  containerPath: Path;
  selectedPath: Path;
  /** The keys of the values of a container, in the order that the list shows them */
  getValueKeys: (containerPath: Path) => Array<string | number>;
  onSelect: (path: Path) => void;
}

/** The values of a container that is not a container themselves: for the layout with the containers in the tree */
export function TreePrimitiveList(props: Props) {
  const getContainerPath = createStablePath(() => props.containerPath);
  const getTitle = () => getPathLabels(getLatestState(), getContainerPath()).at(-1) ?? 'State';
  // Only the values count: the containers that the filter hides are in the tree, not in the list
  const getHiddenCount = createMemo(() => {
    const container = getPathValue(getLatestState(), getContainerPath());
    const type = getJsonType(container);
    if (!isContainerType(type)) return 0;

    const valueCount = getContainerKeys(container, type).filter(
      (key) => !isContainer((container as JSONSafeObject)[key]),
    ).length;
    return valueCount - props.getValueKeys(getContainerPath()).length;
  });

  return (
    <>
      <div class="sticky top-0 truncate bg-gray-900 px-2 py-1 font-mono text-xs text-gray-400">
        {getTitle()}
        <Show when={getHiddenCount() > 0}>
          <span class="text-amber-400"> · {getHiddenCount()} hidden</span>
        </Show>
      </div>
      <For
        each={props.getValueKeys(getContainerPath())}
        fallback={<p class="px-2 py-1 text-sm text-gray-500 italic">No values</p>}
      >
        {(key) => (
          <NavRow
            id={getRowDomId(props.treeId, pathKey([...getContainerPath(), key]))}
            path={[...getContainerPath(), key]}
            selectionState={
              pathEquals(props.selectedPath, [...getContainerPath(), key]) ? 'selected' : 'normal'
            }
            onClick={() => props.onSelect([...getContainerPath(), key])}
          />
        )}
      </For>
    </>
  );
}
