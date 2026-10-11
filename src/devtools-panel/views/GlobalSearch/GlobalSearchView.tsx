import { createSignal, Show } from 'solid-js';

import { getSettings } from '../../store/store';
import { createGetBreakpoint } from '../../utils/create-get-breakpoint';
import { createPassageSearch } from './store-helpers/create-passage-search';
import { createStateSearch } from './store-helpers/create-state-search';
import { createSearchPersistence } from './store-helpers/search-state';
import { DetailsPane } from './subcomponents/DetailsPane';
import { ActiveChips } from './subcomponents/Filters/ActiveChips';
import { FilterSideBar } from './subcomponents/Filters/FilterSideBar';
import { FilterTopBar } from './subcomponents/Filters/FilterTopBar';
import { ResultsPane } from './subcomponents/ResultsPane';
import { SearchBar } from './subcomponents/SearchBar/SearchBar';
import type { FilterLayout, QueryMatcher, Selected } from './types';

const isSameResult = (a: Selected | null, b: Selected) =>
  a?.section === b.section &&
  (a.section === 'passage' ? a.key === (b as typeof a).key : a.hit.key === (b as typeof a).hit.key);

export function GlobalSearchView() {
  const [getQueryMatcher, setQueryMatcher] = createSignal<QueryMatcher | null>(null);

  const { getPassageHits, getPassageTotal, getTagCounts, getPassage, getSearchesPassageContent } =
    createPassageSearch(getQueryMatcher);

  const { getStateHits, getStateTotal, getTypeCounts } = createStateSearch(getQueryMatcher);

  const [getSelected, setSelected] = createSignal<Selected | null>(null);
  const toggleSelected = (next: Selected) =>
    setSelected((current) => (isSameResult(current, next) ? null : next));
  createSearchPersistence();

  const getBreakpoint = createGetBreakpoint();

  const getFilterLayout = (): FilterLayout => {
    return getBreakpoint() === 'sm' ? getSettings.search.smFilterLayout() : 'full-sidebar';
  };

  return (
    <div class="relative flex h-full w-full overflow-hidden">
      <FilterSideBar
        layout={getFilterLayout()}
        tagCounts={getTagCounts()}
        typeCounts={getTypeCounts()}
      />
      <main class="flex min-w-0 flex-1 flex-col">
        <SearchBar layout={getFilterLayout()} setQueryMatcher={setQueryMatcher} />
        <Show when={getFilterLayout() === 'top-bar'}>
          <FilterTopBar tagCounts={getTagCounts()} typeCounts={getTypeCounts()} />
        </Show>
        <ActiveChips />
        <div class="min-h-0 flex-1">
          <ResultsPane
            hasQuery={getQueryMatcher() !== null}
            sortedStateHits={getStateHits()}
            stateTotal={getStateTotal()}
            sortedPassageHits={getPassageHits()}
            passageTotal={getPassageTotal()}
            getPassage={getPassage}
            queryMatcher={getQueryMatcher()}
            selected={getSelected()}
            onToggleSelected={toggleSelected}
          />
        </div>
      </main>
      <DetailsPane
        mode={getBreakpoint() === 'lg' ? 'column' : 'sheet'}
        getPassage={getPassage}
        selected={getSelected()}
        onClose={() => setSelected(null)}
        queryMatcher={getQueryMatcher()}
        searchesContent={getSearchesPassageContent()}
      />
    </div>
  );
}
