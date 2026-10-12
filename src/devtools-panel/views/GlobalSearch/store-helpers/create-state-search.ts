import { createMemo, createProjection, snapshot, untrack, type Accessor } from 'solid-js';

import { getLastChangeIdByKey, getLatestId, getLatestState } from '../../../store/game-state';
import { sortStateHits } from '../logic/sort';
import { countTypes, searchState } from '../logic/state-search';
import type { QueryMatcher, StateMatcherHit, StateScope } from '../types';
import { createDefaultScope } from '../utils/search-defaults';
import { getScope, getSort, getTypeFilter } from './search-state';

const NO_HITS: StateMatcherHit[] = [];

export function createStateSearch(getQueryMatcher: Accessor<QueryMatcher | null>) {
  // A flag only notifies when it changes: resetting the filters makes a new scope with the same
  // flags, and that must not search again
  const scope = createProjection<StateScope>((draft) => {
    Object.assign(draft, getScope().state);
  }, createDefaultScope().state);

  const found = createMemo(() => {
    const queryMatcher = getQueryMatcher();
    if (!queryMatcher) return NO_HITS;

    // Searched again whenever the state changes: that is what the id says
    getLatestId();
    return searchState(
      untrack(() => snapshot(getLatestState())),
      queryMatcher,
      scope,
    );
  });

  const filtered = createMemo(() => {
    const hits = found();
    const types = getTypeFilter();
    return types.length ? hits.filter((hit) => types.includes(hit.type)) : hits;
  });

  // The state is searched again whenever it changes, so sorting doesn't have to track the changes
  const sorted = createMemo<StateMatcherHit[]>(() => {
    const hits = filtered();
    const sort = getSort().state;
    return untrack(() => sortStateHits(hits, sort, getLastChangeIdByKey));
  });

  // Counted when a filter that shows them is on the page, not for every search
  const getTypeCounts = createMemo(() => countTypes(found()));

  return {
    /** Filtered and sorted */
    getStateHits: sorted,
    /** Found, before the filters */
    getStateTotal: () => found().length,
    getTypeCounts,
  };
}
