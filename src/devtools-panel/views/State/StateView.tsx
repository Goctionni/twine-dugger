import { createMemo, createSignal } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { setViewState, store } from '@/devtools-panel/store/store';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import type { ValueType } from '@/shared/shared-types';

import { StateNav } from './Navigators/StateNav';
import { Toolbar } from './Toolbar/Toolbar';
import type { Navigator, SelectionKind, Sort } from './types';

const mockTypes: ValueType[] = [
  'string',
  'number',
  'boolean',
  'object',
  'map',
  'array',
  'set',
  'other',
];

export function StateView() {
  const [getNavigator, setNavigator] = createSignal<Navigator>('miller');
  const [getSearchText, setSearchText] = createSignal('');
  const [getHiddenTypes, setHiddenTypes] = createSignal<ValueType[]>([]);
  const [getSort, setSort] = createSignal<Sort>('type');

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
        types={mockTypes}
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
