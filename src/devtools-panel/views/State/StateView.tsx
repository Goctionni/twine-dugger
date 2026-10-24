import { Show, createMemo, createSignal } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getStatePath, requestScrollTo, setStatePath } from '@/devtools-panel/store/state-location';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { Breadcrumbs } from './Breadcrumbs/Breadcrumbs';
import { Inspector } from './Inspector/Inspector';
import { TYPE_ORDER } from './logic/sort-keys';
import {
  NavigatorInfoContext,
  type NavigatorInfo,
  type PublishNavigatorInfo,
} from './Navigators/navigator-info';
import { TypeAheadContext, type TypedText } from './Navigators/Shared/TypeAhead/type-ahead-context';
import { TypeAheadLabel } from './Navigators/Shared/TypeAhead/TypeAheadLabel';
import { StateNav } from './Navigators/StateNav';
import {
  getHiddenTypes,
  getNavigator,
  getSort,
  setHiddenTypes,
  setNavigator,
  setSort,
} from './store-helpers/view-prefs';
import { Toolbar } from './Toolbar/Toolbar';
import type { SelectionKind } from './types';

export function StateView() {
  const [getSearchText, setSearchText] = createSignal('');

  const [getNavigatorInfo, setNavigatorInfo] = createSignal<NavigatorInfo>();
  // A navigator that another one replaces takes back only its own info
  const publishNavigatorInfo: PublishNavigatorInfo = (info) => {
    setNavigatorInfo(info);
    return () => setNavigatorInfo((current) => (current === info ? undefined : current));
  };

  const getSelectionKind = createMemo<SelectionKind>(() =>
    isContainerType(getJsonType(getPathValue(getLatestState(), getStatePath())))
      ? 'container'
      : 'primitive',
  );

  // Only for a narrow and short view, where the inspector covers the navigator. It does not open for
  // a container: that one is opened to look into it, and is edited in a larger view
  const [getClosedPathKey, setClosedPathKey] = createSignal<string>();
  const isOverlayOpen = () =>
    getSelectionKind() === 'primitive' && getClosedPathKey() !== pathKey(getStatePath());

  const select = (path: Path) => {
    setClosedPathKey(undefined);
    setStatePath(path);
  };
  // For what is not a row of the navigator: the selection may be out of view
  const selectAndScrollTo = (path: Path) => {
    select(path);
    requestScrollTo();
  };

  const [getTypedText, setTypedText] = createSignal<TypedText>();

  const onBreadcrumbClick = (path: Path) => {
    const onNavigatorBreadcrumbClick = getNavigatorInfo()?.onBreadcrumbClick;
    if (onNavigatorBreadcrumbClick) onNavigatorBreadcrumbClick(path);
    else selectAndScrollTo(path);
  };

  return (
    <NavigatorInfoContext value={publishNavigatorInfo}>
      <TypeAheadContext value={setTypedText}>
        <div class="flex h-full flex-col [container:frame/size]">
          <Toolbar
            navigator={getNavigator()}
            onNavigatorChange={setNavigator}
            searchText={getSearchText()}
            onSearchTextChange={setSearchText}
            availableTypes={getNavigatorInfo()?.getAvailableTypes() ?? TYPE_ORDER}
            hiddenTypes={getHiddenTypes()}
            onHiddenTypesChange={setHiddenTypes}
            sort={getSort()}
            onSortChange={setSort}
          />
          <div class="flex min-h-0 flex-1 flex-col">
            <Breadcrumbs
              path={getNavigatorInfo()?.getBreadcrumbsPath() ?? getStatePath()}
              onSelect={onBreadcrumbClick}
            />
            <div class="relative flex min-h-0 flex-1 inspector-sheet:flex-col">
              <div class="relative min-h-0 min-w-0 flex-1">
                <div class="absolute inset-0 overflow-auto">
                  <StateNav navigator={getNavigator()} path={getStatePath()} onSelect={select} />
                </div>
                <Show when={getTypedText()}>{(typed) => <TypeAheadLabel typed={typed()} />}</Show>
              </div>
              <Inspector
                path={getStatePath()}
                onSelect={selectAndScrollTo}
                selectionKind={getSelectionKind()}
                isOverlayOpen={isOverlayOpen()}
                onClose={() => setClosedPathKey(pathKey(getStatePath()))}
              />
            </div>
          </div>
        </div>
      </TypeAheadContext>
    </NavigatorInfoContext>
  );
}
