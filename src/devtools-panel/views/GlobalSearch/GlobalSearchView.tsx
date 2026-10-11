import { createMemo, createProjection, createSignal, Show, untrack } from 'solid-js';

import { getSettings } from '../../store/store';
import { createGetBreakpoint } from './create-get-breakpoint';
import {
  countPassageMatches,
  countTags,
  searchPassages,
  type PassageSearch,
} from './logic/passage-search';
import { rankNames, sortPassageHits, sortStateHits } from './logic/sort';
import { countTypes, searchState } from './logic/state-search';
import { createSelection, SelectionContext } from './selection';
import { createSearchScopes } from './store-helpers/create-search-scopes';
import {
  getLastChange,
  getPassages,
  getStateVersion,
  getUntrackedState,
} from './store-helpers/game-data';
import {
  createSearchPersistence,
  getSort,
  getTagFilter,
  getTypeFilter,
} from './store-helpers/search-state';
import { DetailsPane } from './subcomponents/DetailsPane';
import { ActiveChips } from './subcomponents/Filters/ActiveChips';
import { FilterSideBar } from './subcomponents/Filters/FilterSideBar';
import { FilterTopBar } from './subcomponents/Filters/FilterTopBar';
import { ResultsPane } from './subcomponents/ResultsPane';
import { SearchBar } from './subcomponents/SearchBar/SearchBar';
import type { FilterLayout, PassageMatcherHit, QueryMatcher, StateMatcherHit } from './types';

const NO_STATE_HITS: StateMatcherHit[] = [];

export function GlobalSearchView() {
  // What is searched for: made by the search bar. Null when there is nothing to search for, or the
  // search text is not valid
  const [getQueryMatcher, setQueryMatcher] = createSignal<QueryMatcher | null>(null);

  const { passageScope, stateScope } = createSearchScopes();

  // Searched again when the queryMatcher, the scope or the passages change, and only the passages the
  // previous search found when that is enough
  const foundPassages = createMemo((previous: PassageSearch | undefined) =>
    searchPassages(previous, getPassages(), getQueryMatcher(), passageScope),
  );

  // Searched again when the queryMatcher, the scope or the state change
  const foundState = createMemo(() => {
    const queryMatcher = getQueryMatcher();
    if (!queryMatcher) return NO_STATE_HITS;

    getStateVersion();
    return searchState(untrack(getUntrackedState), queryMatcher, stateScope);
  });

  // Filtering and sorting work on what was found: they never search again
  const getPassageById = createMemo(() => new Map(getPassages().map((p) => [p.id, p])));

  const filteredPassageHits = createMemo(() => {
    const hits = foundPassages().hits;
    const tags = getTagFilter();
    if (!tags.length) return hits;
    const passageById = getPassageById();
    return hits.filter((hit) => passageById.get(hit.key)?.tags?.some((tag) => tags.includes(tag)));
  });
  const filteredStateHits = createMemo(() => {
    const hits = foundState();
    const types = getTypeFilter();
    return types.length ? hits.filter((hit) => types.includes(hit.type)) : hits;
  });

  // Only made when a name sort asks for it
  const getNameRanks = createMemo(() => rankNames(getPassages()));

  // A plain array that is new every time the results change. The hit lists below keep the hits that
  // are still there as the same objects, and the array tells a virtual list that the keys at its
  // positions may have changed
  const sortedPassageHits = createMemo<PassageMatcherHit[]>(() =>
    sortPassageHits(filteredPassageHits(), getSort().passage, {
      getNameRank: (id) => getNameRanks().get(id) ?? 0,
      // Only asked for when sorting by matches: counting every match in every passage is real work
      getMatchCount: (hit) => {
        const queryMatcher = getQueryMatcher();
        const content = getPassageById().get(hit.key)?.content;
        return queryMatcher ? countPassageMatches(hit, content, queryMatcher, passageScope) : 0;
      },
    }),
  );
  // The state is searched again whenever it changes, so sorting doesn't have to track the changes
  const sortedStateHits = createMemo<StateMatcherHit[]>(() => {
    const hits = filteredStateHits();
    const sort = getSort().state;
    return untrack(() => sortStateHits(hits, sort, getLastChange));
  });

  // The same hits, but a hit that is still there is the same object: its row is left alone
  const passageHits = createProjection<PassageMatcherHit[]>(() => sortedPassageHits(), [], {
    key: 'key',
  });
  const stateHits = createProjection<StateMatcherHit[]>(() => sortedStateHits(), [], {
    key: 'key',
  });

  // Counted when a filter that shows them is on the page, not for every search
  const tagCounts = createMemo(() => countTags(foundPassages().passages));
  const typeCounts = createMemo(() => countTypes(foundState()));

  // For the parts that show more than the hits have
  const getPassage = (id: number) => getPassageById().get(id);
  const findRanges = (text: string, max?: number) => getQueryMatcher()?.ranges(text, max) ?? [];
  const countMatches = (text: string) => getQueryMatcher()?.count(text) ?? 0;

  const selection = createSelection();
  createSearchPersistence();

  const getBreakpoint = createGetBreakpoint();

  const getFilterLayout = (): FilterLayout => {
    return getBreakpoint() === 'sm' ? getSettings.search.smFilterLayout() : 'full-sidebar';
  };

  return (
    <SelectionContext value={selection}>
      <div class="relative flex h-full w-full overflow-hidden">
        <FilterSideBar
          layout={getFilterLayout()}
          tagCounts={tagCounts()}
          typeCounts={typeCounts()}
        />
        <main class="flex min-w-0 flex-1 flex-col">
          <SearchBar layout={getFilterLayout()} setQueryMatcher={setQueryMatcher} />
          <Show when={getFilterLayout() === 'top-bar'}>
            <FilterTopBar tagCounts={tagCounts()} typeCounts={typeCounts()} />
          </Show>
          <ActiveChips />
          <div class="min-h-0 flex-1">
            <ResultsPane
              hasQuery={getQueryMatcher() !== null}
              stateHits={stateHits}
              sortedStateHits={sortedStateHits()}
              stateTotal={foundState().length}
              passageHits={passageHits}
              sortedPassageHits={sortedPassageHits()}
              passageTotal={foundPassages().hits.length}
              getPassage={getPassage}
              countMatches={countMatches}
            />
          </div>
        </main>
        <DetailsPane
          mode={getBreakpoint() === 'lg' ? 'column' : 'sheet'}
          getPassage={getPassage}
          sortedStateHits={sortedStateHits()}
          findRanges={findRanges}
        />
      </div>
    </SelectionContext>
  );
}
