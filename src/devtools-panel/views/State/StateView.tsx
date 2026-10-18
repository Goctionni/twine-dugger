import { createMemo, createSignal } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { setStatePath } from '@/devtools-panel/store/state-location';
import { store } from '@/devtools-panel/store/store';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';

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
    isContainerType(getJsonType(getPathValue(getLatestState(), store.viewState.state.path)))
      ? 'container'
      : 'primitive',
  );

  // Only for a narrow and short view, where the inspector covers the navigator. It does not open for
  // a container: that one is opened to look into it, and is edited in a larger view
  const [getClosedPathKey, setClosedPathKey] = createSignal<string>();
  const isOverlayOpen = () =>
    getSelectionKind() === 'primitive' &&
    getClosedPathKey() !== pathKey(store.viewState.state.path);

  return (
    <div class="flex h-full flex-col [container:frame/size]">
      <Toolbar
        navigator={getNavigator()}
        onNavigatorChange={setNavigator}
        searchText={getSearchText()}
        onSearchTextChange={setSearchText}
        path={store.viewState.state.path}
        hiddenTypes={getHiddenTypes()}
        onHiddenTypesChange={setHiddenTypes}
        sort={getSort()}
        onSortChange={setSort}
      />
      <div class="min-h-0 flex-1">
        <StateNav
          navigator={getNavigator()}
          path={store.viewState.state.path}
          selectionKind={getSelectionKind()}
          onSelect={(path) => {
            setClosedPathKey(undefined);
            setStatePath(path);
          }}
          isOverlayOpen={isOverlayOpen()}
          onCloseOverlay={() => setClosedPathKey(pathKey(store.viewState.state.path))}
        />
      </div>
    </div>
  );
}
