import { Show } from 'solid-js';

import { SearchContext, SelectionContext } from '../search/model/context';
import { createGetBreakpoint } from '../search/model/create-get-breakpoint';
import { createSearch } from '../search/model/create-search';
import { gameData } from '../search/model/game-data';
import { createSearchPersistence, searchInput } from '../search/model/search-state';
import { createSelection } from '../search/model/selection';
import type { FilterLayout } from '../search/types';
import { DetailsPane } from '../search/ui/detail/DetailsPane';
import { ActiveChips } from '../search/ui/filters/ActiveChips';
import { FilterSideBar } from '../search/ui/filters/FilterSideBar';
import { FilterTopBar } from '../search/ui/filters/FilterTopBar';
import { ResultsPane } from '../search/ui/results/ResultsPane';
import { SearchBar } from '../search/ui/SearchBar';
import { getSettings } from '../store/store';

export function SearchPage() {
  const model = createSearch(gameData, searchInput);
  const selection = createSelection();
  createSearchPersistence();

  const getBreakpoint = createGetBreakpoint();

  const getFilterLayout = (): FilterLayout => {
    return getBreakpoint() === 'sm' ? getSettings.search.smFilterLayout() : 'full-sidebar';
  };

  return (
    <SearchContext value={model}>
      <SelectionContext value={selection}>
        <div class="relative flex h-full w-full overflow-hidden">
          <FilterSideBar layout={getFilterLayout()} />
          <main class="flex min-w-0 flex-1 flex-col">
            <SearchBar layout={getFilterLayout()} />
            <Show when={getFilterLayout() === 'top-bar'}>
              <FilterTopBar />
            </Show>
            <ActiveChips />
            <div class="min-h-0 flex-1">
              <ResultsPane />
            </div>
          </main>
          <DetailsPane mode={getBreakpoint() === 'lg' ? 'column' : 'sheet'} />
        </div>
      </SelectionContext>
    </SearchContext>
  );
}
