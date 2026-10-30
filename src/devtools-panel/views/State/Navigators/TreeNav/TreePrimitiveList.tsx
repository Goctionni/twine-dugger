import { Show, createMemo } from 'solid-js';

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

import { getNodeName } from '../../logic/get-node-name';
import type { createVirtualList } from '../Shared/create-virtual-list';
import { NavRow } from '../Shared/NavRow';
import { VirtualItems } from '../Shared/VirtualItems';
import { getRowDomId } from './logic/row-dom-id';

interface Props {
  /** The id of the tree that the list is in: the ids of the rows are made from it */
  treeId: string;
  /** The container whose values are listed */
  containerPath: Path;
  selectedPath: Path;
  /** The keys of the values of the container, in the order that the list shows them */
  getValueKeys: () => Array<string | number>;
  /** Only the values near the window are in the DOM */
  valueList: ReturnType<typeof createVirtualList>;
  onSelect: (path: Path) => void;
}

/** The values of a container that is not a container themselves: for the layout with the containers in the tree */
export function TreePrimitiveList(props: Props) {
  const getContainerPath = createStablePath(() => props.containerPath);
  const getTitle = () => getNodeName(getLatestState(), getContainerPath());
  // Only the values count: the containers that the filter hides are in the tree, not in the list
  const getHiddenCount = createMemo(() => {
    const container = getPathValue(getLatestState(), getContainerPath());
    const type = getJsonType(container);
    if (!isContainerType(type)) return 0;

    const valueCount = getContainerKeys(container, type).filter(
      (key) => !isContainer((container as JSONSafeObject)[key]),
    ).length;
    return valueCount - props.getValueKeys().length;
  });

  return (
    <>
      <div class="sticky top-0 z-10 truncate bg-gray-900 px-3 py-1 font-mono text-xs text-gray-400">
        {getTitle()}
        <Show when={getHiddenCount() > 0}>
          <span class="text-amber-400"> · {getHiddenCount()} hidden</span>
        </Show>
      </div>
      <div class="p-1">
        <Show
          when={props.getValueKeys().length > 0}
          fallback={<p class="px-2 py-1 text-sm text-gray-500 italic">No values</p>}
        >
          <VirtualItems list={props.valueList}>
            {(item) => {
              const getPath = () => [...getContainerPath(), item.key];
              return (
                <NavRow
                  id={getRowDomId(props.treeId, pathKey(getPath()))}
                  path={getPath()}
                  selectionState={pathEquals(props.selectedPath, getPath()) ? 'selected' : 'normal'}
                  onClick={() => props.onSelect(getPath())}
                />
              );
            }}
          </VirtualItems>
        </Show>
      </div>
    </>
  );
}
