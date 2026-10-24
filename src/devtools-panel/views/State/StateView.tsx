import { createMemo, createSignal } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getStatePath, requestScrollTo, setStatePath } from '@/devtools-panel/store/state-location';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { Breadcrumbs } from './Breadcrumbs/Breadcrumbs';
import { Inspector } from './Inspector/Inspector';
import { navigators } from './Navigators/navigators';
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

  return (
    <div class="flex h-full flex-col [container:frame/size]">
      <Toolbar
        navigator={getNavigator()}
        onNavigatorChange={setNavigator}
        searchText={getSearchText()}
        onSearchTextChange={setSearchText}
        hiddenTypes={getHiddenTypes()}
        onHiddenTypesChange={setHiddenTypes}
        sort={getSort()}
        onSortChange={setSort}
      />
      <div class="flex min-h-0 flex-1 flex-col">
        <Breadcrumbs
          path={navigators[getNavigator()].getBreadcrumbsPath()}
          onSelect={selectAndScrollTo}
        />
        <div class="relative flex min-h-0 flex-1 inspector-sheet:flex-col">
          <div class="min-h-0 min-w-0 flex-1 overflow-auto">
            <StateNav navigator={getNavigator()} path={getStatePath()} onSelect={select} />
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
  );
}
