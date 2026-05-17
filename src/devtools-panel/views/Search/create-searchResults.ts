import { createScheduled, debounce } from '@solid-primitives/scheduled';
import { createEffect, createSignal } from 'solid-js';

import {
  createGetViewState,
  getLatestStateFrame,
  getNavigationPage,
  getPassageData,
} from '@/devtools-panel/store';
import { SearchResultsCombined } from '@/shared/shared-types';

import { findPassageMatches, findStateMatches } from './search-utils';

type AbortFn = () => void;
const EMPTY: SearchResultsCombined = { state: [], passage: [] };
const SEARCH_RESULTS_DEBOUNCE_DELAY_MS = 450;

export function createSearchResults() {
  const getQuery = createGetViewState('search', 'query');
  const scheduleSearch = createScheduled((fn) => debounce(fn, SEARCH_RESULTS_DEBOUNCE_DELAY_MS));

  const [getSearchResults, setSearchResults] = createSignal<SearchResultsCombined>(EMPTY);

  createEffect((abortPrev: null | AbortFn) => {
    if (abortPrev) abortPrev();

    // If we're not looking at the search results tab, dont both updating
    if (getNavigationPage() !== 'search') return null;

    const query = getQuery();
    const shouldRunSearch = scheduleSearch();
    const gameState = getLatestStateFrame();
    if (!query || !gameState) {
      setSearchResults(EMPTY);
      return null;
    }
    if (!shouldRunSearch) return null;

    const [statePromise, stateAbort] = findStateMatches(gameState.state, query);
    const [passagePromise, passageAbort] = findPassageMatches(getPassageData(), query);

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
  }, null);

  return getSearchResults;
}
