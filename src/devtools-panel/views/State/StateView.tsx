import { createMemo, createSignal } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { setViewState, store } from '@/devtools-panel/store/store';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';

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

  return (
    <div class="flex h-full flex-col">
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
          onSelect={(path) => setViewState('state', 'path', path)}
        />
      </div>
    </div>
  );
}
