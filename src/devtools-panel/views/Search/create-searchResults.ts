import { createEffect, createSignal, snapshot } from 'solid-js';

import {
  createGetViewState,
  getLatestId,
  getLatestState,
  getNavigationPage,
  getPassageData,
} from '@/devtools-panel/store/store';
import type { SearchResultsCombined } from '@/shared/shared-types';

import { createScheduled, scheduleIdle } from '../../utils/scheduled';
import { findPassageMatches, findStateMatches } from './search-utils';

type AbortFn = () => void;
const EMPTY: SearchResultsCombined = { state: [], passage: [] };

export function createSearchResults() {
  const getQuery = createGetViewState('search', 'query');
  const scheduleSearch = createScheduled((fn) => scheduleIdle(fn));

  const [getSearchResults, setSearchResults] = createSignal<SearchResultsCombined>(EMPTY);

  createEffect(
    () => ({
      page: getNavigationPage(),
      query: getQuery(),
      shouldRunSearch: scheduleSearch(),
      passages: getPassageData(),
      // The state itself is read when searching; a new diff is what makes the search stale
      stateId: getLatestId(),
    }),
    ({ page, query, shouldRunSearch, passages }): AbortFn | undefined => {
      // If we're not looking at the search results tab, dont both updating
      if (page !== 'search') return;

      if (!query) {
        setSearchResults(EMPTY);
        return;
      }
      if (!shouldRunSearch) return;

      const [statePromise, stateAbort] = findStateMatches(snapshot(getLatestState()), query);
      const [passagePromise, passageAbort] = findPassageMatches(passages, query);

      let alive = true;
      const abortCurr = () => {
        alive = false;
        stateAbort();
        passageAbort('Updated search');
      };

      Promise.all([statePromise, passagePromise])
        .then(([state, passage]) => {
          if (!alive) return;
          setSearchResults({ state, passage });
        })
        .catch(() => {});

      return abortCurr;
    },
  );

  return getSearchResults;
}
