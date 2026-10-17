import { createSignal } from 'solid-js';

import type { ValueType } from '@/shared/shared-types';

import { StateNav } from './Navigators/StateNav';
import { Toolbar } from './Toolbar/Toolbar';
import type { Navigator, Sort } from './types';

const mockPath = ['character', 'stats', 'fitness'];
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
        <StateNav navigator={getNavigator()} path={mockPath} selectionKind="container" />
      </div>
    </div>
  );
}
