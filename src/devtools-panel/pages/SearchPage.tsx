import { createMemo, createProjection, createSignal, Show, untrack } from 'solid-js';

import {
  countPassageMatches,
  countTags,
  searchPassages,
  type PassageSearch,
} from '../search/core/passage-search';
import { rankNames, sortPassageHits, sortStateHits } from '../search/core/sort';
import { countTypes, searchState } from '../search/core/state-search';
import {
  createDefaultScope,
  type Matcher,
  type PassageHit,
  type PassageScope,
  type StateHit,
  type StateScope,
} from '../search/core/types';
import { SelectionContext } from '../search/model/context';
import { createGetBreakpoint } from '../search/model/create-get-breakpoint';
import { gameData } from '../search/model/game-data';
import {
  createSearchPersistence,
  getScope,
  getSort,
  getTagFilter,
  getTypeFilter,
} from '../search/model/search-state';
import { createSelection } from '../search/model/selection';
import type { FilterLayout } from '../search/types';
import { DetailsPane } from '../search/ui/detail/DetailsPane';
import { ActiveChips } from '../search/ui/filters/ActiveChips';
import { FilterSideBar } from '../search/ui/filters/FilterSideBar';
import { FilterTopBar } from '../search/ui/filters/FilterTopBar';
import { ResultsPane } from '../search/ui/results/ResultsPane';
import { SearchBar } from '../search/ui/SearchBar/SearchBar';
import { getSettings } from '../store/store';

const NO_STATE_HITS: StateHit[] = [];

export function SearchPage() {
  // What is searched for: made by the search bar. Null when there is nothing to search for, or the
  // search text is not valid
  const [getMatcher, setMatcher] = createSignal<Matcher | null>(null);

  // What is searched in. A flag only notifies when it changes, so that resetting the filters (which
  // makes a new scope with the same flags) does not search again
  const passageScope = createProjection<PassageScope>((draft) => {
    Object.assign(draft, getScope().passage);
  }, createDefaultScope().passage);
  const stateScope = createProjection<StateScope>((draft) => {
    Object.assign(draft, getScope().state);
  }, createDefaultScope().state);

  // Searched again when the matcher, the scope or the passages change, and only the passages the
  // previous search found when that is enough
  const foundPassages = createMemo((previous: PassageSearch | undefined) =>
    searchPassages(previous, gameData.passages(), getMatcher(), passageScope),
  );

  // Searched again when the matcher, the scope or the state change
  const foundState = createMemo(() => {
    const matcher = getMatcher();
    if (!matcher) return NO_STATE_HITS;

    gameData.stateVersion();
    return searchState(untrack(gameData.getState), matcher, stateScope);
  });

  // Filtering and sorting work on what was found: they never search again
  const getPassageById = createMemo(() => new Map(gameData.passages().map((p) => [p.id, p])));

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
  const getNameRanks = createMemo(() => rankNames(gameData.passages()));

  // A plain array that is new every time the results change. The hit lists below keep the hits that
  // are still there as the same objects, and the array tells a virtual list that the keys at its
  // positions may have changed
  const sortedPassageHits = createMemo<PassageHit[]>(() =>
    sortPassageHits(filteredPassageHits(), getSort().passage, {
      getNameRank: (id) => getNameRanks().get(id) ?? 0,
      // Only asked for when sorting by matches: counting every match in every passage is real work
      getMatchCount: (hit) => {
        const matcher = getMatcher();
        const content = getPassageById().get(hit.key)?.content;
        return matcher ? countPassageMatches(hit, content, matcher, passageScope) : 0;
      },
    }),
  );
  // The state is searched again whenever it changes, so sorting doesn't have to track the changes
  const sortedStateHits = createMemo<StateHit[]>(() => {
    const hits = filteredStateHits();
    const sort = getSort().state;
    return untrack(() => sortStateHits(hits, sort, gameData.getLastChange));
  });

  // The same hits, but a hit that is still there is the same object: its row is left alone
  const passageHits = createProjection<PassageHit[]>(() => sortedPassageHits(), [], { key: 'key' });
  const stateHits = createProjection<StateHit[]>(() => sortedStateHits(), [], { key: 'key' });

  // Counted when a filter that shows them is on the page, not for every search
  const tagCounts = createMemo(() => countTags(foundPassages().passages));
  const typeCounts = createMemo(() => countTypes(foundState()));

  // For the parts that show more than the hits have
  const getPassage = (id: number) => getPassageById().get(id);
  const findRanges = (text: string, max?: number) => getMatcher()?.ranges(text, max) ?? [];
  const countMatches = (text: string) => getMatcher()?.count(text) ?? 0;

  const selection = createSelection();
  createSearchPersistence();

  const getBreakpoint = createGetBreakpoint();

  const getFilterLayout = (): FilterLayout => {
    return getBreakpoint() === 'sm' ? getSettings.search.smFilterLayout() : 'full-sidebar';
  };

  return (
    <SelectionContext value={selection}>
      <div class="relative flex h-full w-full overflow-hidden">
        <FilterSideBar layout={getFilterLayout()} tagCounts={tagCounts} typeCounts={typeCounts} />
        <main class="flex min-w-0 flex-1 flex-col">
          <SearchBar layout={getFilterLayout()} setMatcher={setMatcher} />
          <Show when={getFilterLayout() === 'top-bar'}>
            <FilterTopBar tagCounts={tagCounts} typeCounts={typeCounts} />
          </Show>
          <ActiveChips />
          <div class="min-h-0 flex-1">
            <ResultsPane
              hasQuery={getMatcher() !== null}
              stateHits={stateHits}
              sortedStateHits={sortedStateHits}
              stateTotal={foundState().length}
              passageHits={passageHits}
              sortedPassageHits={sortedPassageHits}
              passageTotal={foundPassages().hits.length}
              getPassage={getPassage}
              countMatches={countMatches}
            />
          </div>
        </main>
        <DetailsPane
          mode={getBreakpoint() === 'lg' ? 'column' : 'sheet'}
          getPassage={getPassage}
          sortedStateHits={sortedStateHits}
          findRanges={findRanges}
        />
      </div>
    </SelectionContext>
  );
}
