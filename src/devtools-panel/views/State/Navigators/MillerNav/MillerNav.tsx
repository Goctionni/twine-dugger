import { Match, Repeat, Switch, createMemo } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { getStatePath, requestScrollTo } from '@/devtools-panel/store/state-location';
import { isHiddenInState, isPinned } from '@/devtools-panel/store/store';
import { createElementWidth } from '@/devtools-panel/utils/create-element-width';
import { getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { NoMatches } from '../../NoMatches';
import { getSearchMatcher } from '../../state-search';
import { getHiddenKeyCheck, getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import type { NavProps } from '../../types';
import { provideNavigatorInfo } from '../navigator-info';
import { isArrowKey } from '../Shared/arrow-keys';
import { getNodeName } from '../Shared/get-node-name';
import { isTypeAheadKey, provideTypeAhead } from '../Shared/TypeAhead/provide-type-ahead';
import { getVisibleKeys } from '../Shared/visible-keys';
import { countCollapsed } from './logic/count-collapsed';
import { countColumns } from './logic/count-columns';
import { getKeyTarget } from './logic/key-target';
import { nextTrail } from './logic/next-trail';
import { getRowId, getStripId } from './logic/row-id';
import { getTypesInColumns } from './logic/types-in-columns';
import { MillerColumn } from './MillerColumn';
import { MillerStrip } from './MillerStrip';

export function MillerNav(props: NavProps) {
  const treeId = `miller-${crypto.randomUUID()}`;

  const getWidth = createElementWidth(() => tree);
  const getColumnCount = createMemo(() =>
    countColumns(
      getLatestState(),
      props.path,
      getHiddenTypes(),
      getSearchMatcher(),
      isHiddenInState,
    ),
  );

  let tree: HTMLDivElement | undefined;
  const getCollapsed = createMemo(() => countCollapsed(getColumnCount(), getWidth()));

  // A copy: the path in the store is changed in place, and the trail has to keep what it was
  const getTrail = createMemo<Path>((trail) => nextTrail(trail ?? [], props.path.slice()));

  const getKeysAt = (containerPath: Path) =>
    getVisibleKeys(
      getPathValue(getLatestState(), containerPath),
      getSort(),
      getHiddenTypes(),
      (key) => getLastChangeId([...containerPath, key]),
      (key) => isPinned([...containerPath, key]),
      getSearchMatcher(),
      getHiddenKeyCheck(containerPath),
    );

  provideNavigatorInfo({
    getBreadcrumbsPath: getStatePath,
    getAvailableTypes: () => getTypesInColumns(getLatestState(), getStatePath()),
  });

  const getActiveId = () => {
    if (!props.path.length) return undefined;
    const depth = props.path.length - 1;
    // The row is not there when its column is a strip
    return depth < getCollapsed()
      ? getStripId(treeId, depth)
      : getRowId(treeId, depth, props.path.at(-1)!);
  };

  // The rows of the column of the selection: typing goes through the ones next to the selected one
  const getSiblingKeys = () => getKeysAt(props.path.slice(0, -1));
  const handleTypeAheadKey = provideTypeAhead({
    getNames: () =>
      getSiblingKeys().map((key) =>
        getNodeName(getLatestState(), [...props.path.slice(0, -1), key]),
      ),
    getSelectedIndex: () => {
      const key = props.path.at(-1);
      return key === undefined ? -1 : getSiblingKeys().indexOf(key);
    },
    selectIndex: (index) => {
      props.onSelect([...props.path.slice(0, -1), getSiblingKeys()[index]!]);
      requestScrollTo();
    },
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (isTypeAheadKey(event)) return handleTypeAheadKey(event);
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (!isArrowKey(event.key)) return;
    event.preventDefault();

    const target = getKeyTarget(event.key, props.path, getTrail(), getKeysAt);
    if (!target) return;
    props.onSelect(target);
    requestScrollTo();
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
      class="relative flex h-full overflow-x-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500"
    >
      <NoMatches isEmpty={getColumnCount() === 0} />
      <Repeat count={getColumnCount()}>
        {(depth) => (
          <Switch>
            <Match when={depth < getCollapsed()}>
              <MillerStrip
                treeId={treeId}
                depth={depth}
                path={props.path}
                onSelect={props.onSelect}
              />
            </Match>
            <Match when={depth >= getCollapsed()}>
              <MillerColumn
                treeId={treeId}
                depth={depth}
                path={props.path}
                trail={getTrail()}
                onSelect={props.onSelect}
              />
            </Match>
          </Switch>
        )}
      </Repeat>
    </div>
  );
}
