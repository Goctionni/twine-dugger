import { Match, Show, Switch, createMemo } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { getStatePath, requestScrollTo } from '@/devtools-panel/store/state-location';
import { isPinned } from '@/devtools-panel/store/store';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue } from '@/shared/json-safe';
import { pathEquals, pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { NoMatches } from '../../NoMatches';
import { getSearchMatcher } from '../../state-search';
import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import type { NavProps } from '../../types';
import { provideNavigatorInfo } from '../navigator-info';
import { isArrowKey } from '../Shared/arrow-keys';
import { createScrollToSelection } from '../Shared/create-scroll-to-selection';
import { createVirtualList } from '../Shared/create-virtual-list';
import { getNodeName } from '../Shared/get-node-name';
import { isTypeAheadKey, provideTypeAhead } from '../Shared/TypeAhead/provide-type-ahead';
import { VirtualItems } from '../Shared/VirtualItems';
import { getVisibleKeys } from '../Shared/visible-keys';
import { createContainerMemos } from './create-container-memos';
import { createShownTypes } from './create-shown-types';
import { createTreeExpansion } from './create-tree-expansion';
import { createTreeRows } from './create-tree-rows';
import { createValueList } from './create-value-list';
import { getRowDomId } from './logic/row-dom-id';
import { onTreeListArrowKey, onTreeOnlyArrowKey } from './tree-arrow-keys';
import { TreePrimitiveList } from './TreePrimitiveList';
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
        getSearchMatcher(),
      ),
    sameItems,
  );
  const list = createValueList(getSelectedPath, getKeysAt);
  const { getRows, canOpen, isSelectedRowShown } = createTreeRows({
    getSelectedPath,
    expansion,
    list,
    getKeysAt,
  });

  const getShownTypes = createShownTypes({
    getRows,
    isExpanded: expansion.isExpanded,
    hasValueList: list.hasValueList,
    getListedPath: list.getListedPath,
  });
  provideNavigatorInfo({ getBreadcrumbsPath: getStatePath, getAvailableTypes: getShownTypes });

  const getActiveId = () =>
    isSelectedRowShown() ? getRowDomId(treeId, pathKey(getSelectedPath())) : undefined;

  // Only the rows near the window are in the DOM, and the selected one
  const getRowIds = createMemo(() => getRows().map((row) => row.id));
  const getRowsById = createMemo(() => new Map(getRows().map((row) => [row.id, row])));
  const getSelectedRowIndex = createMemo(() => getRowIds().indexOf(pathKey(getSelectedPath())));
  const rowList = createVirtualList({
    getKeys: getRowIds,
    estimateSize: 30,
    getSelectedIndex: getSelectedRowIndex,
  });

  const getListedValueKeys = createMemo(() => {
    const listedPath = list.getListedPath();
    return listedPath ? list.getValueKeysAt(listedPath) : [];
  });
  const isNothingShown = () => getRows().length === 0 && getListedValueKeys().length === 0;
  const getSelectedValueIndex = createMemo(() => {
    const key = getSelectedPath().at(-1);
    return list.isValueSelected() && key !== undefined ? getListedValueKeys().indexOf(key) : -1;
  });
  const valueList = createVirtualList({
    getKeys: getListedValueKeys,
    estimateSize: 30,
    getSelectedIndex: getSelectedValueIndex,
  });

  let tree: HTMLDivElement | undefined;
  createScrollToSelection(
    // The selection is a row, or a value of the list beside the tree
    () => {
      rowList.scrollToSelection();
      valueList.scrollToSelection();
    },
    getSelectedPath,
    isSelectedRowShown,
  );

  // A key that selects a row asks for it to be in view
  const selectByKey = (path: Path) => {
    props.onSelect(path);
    requestScrollTo();
  };

  // Typing goes through what has the focus, in the order that it is shown: the values of the list
  // when one of them is selected, else the rows of the tree
  const getTypeAheadPaths = () => {
    const listedPath = list.getListedPath();
    if (listedPath && list.isValueSelected()) {
      return list.getValueKeysAt(listedPath).map((key) => [...listedPath, key]);
    }
    return getRows().map((row) => row.path);
  };
  const handleTypeAheadKey = provideTypeAhead({
    getNames: () => getTypeAheadPaths().map((path) => getNodeName(getLatestState(), path)),
    getSelectedIndex: () =>
      getTypeAheadPaths().findIndex((path) => pathEquals(path, getSelectedPath())),
    selectIndex: (index) => selectByKey(getTypeAheadPaths()[index]!),
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (isTypeAheadKey(event)) return handleTypeAheadKey(event);
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (!isArrowKey(event.key)) return;
    event.preventDefault();

    const options = {
      selectedPath: getSelectedPath(),
      rows: getRows(),
      canOpen,
      onSelect: selectByKey,
      expansion,
    };
    const listedPath = list.getListedPath();
    if (listedPath) {
      onTreeListArrowKey(event.key, { ...options, listedPath, getValueKeys: list.getValueKeysAt });
    } else {
      onTreeOnlyArrowKey(event.key, options);
    }
  };

  const treeRows = () => (
    <VirtualItems list={rowList}>
      {(item) => (
        <Show when={getRowsById().get(String(item.key))}>
          {(row) => (
            <TreeRow
              treeId={treeId}
              row={row()}
              selectedPath={getSelectedPath()}
              listedPath={list.getListedPath()}
              canOpen={canOpen}
              expansion={expansion}
              onSelect={props.onSelect}
            />
          )}
        </Show>
      )}
    </VirtualItems>
  );

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
      class={[
        'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500',
        list.hasValueList() ? 'flex h-full' : 'relative min-h-full p-1',
      ]}
    >
      <Switch>
        <Match when={list.getListedPath()}>
          {(getListed) => (
            <>
              <div class="relative min-w-0 flex-[0_0_42%] overflow-auto border-r border-gray-700 p-1">
                <NoMatches isEmpty={isNothingShown()} />
                {treeRows()}
              </div>
              <div role="group" aria-label="Values" class="min-w-0 flex-1 overflow-auto">
                <TreePrimitiveList
                  treeId={treeId}
                  containerPath={getListed()}
                  selectedPath={getSelectedPath()}
                  getValueKeys={getListedValueKeys}
                  valueList={valueList}
                  onSelect={props.onSelect}
                />
              </div>
            </>
          )}
        </Match>
        <Match when={!list.hasValueList()}>
          <NoMatches isEmpty={isNothingShown()} />
          {treeRows()}
        </Match>
      </Switch>
    </div>
  );
}
