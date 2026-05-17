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
const FIRST_KEY_DEBOUNCE_MS = 450;
const SUBSEQUENT_KEY_DEBOUNCE_MS = 150;

export function createSearchResults() {
  const getQuery = createGetViewState('search', 'query');
  const scheduleFirstKey = createScheduled((fn) => debounce(fn, FIRST_KEY_DEBOUNCE_MS));
  const scheduleSubsequentKeys = createScheduled((fn) => debounce(fn, SUBSEQUENT_KEY_DEBOUNCE_MS));

  const [getSearchResults, setSearchResults] = createSignal<SearchResultsCombined>(EMPTY);

  createEffect((abortPrev: null | AbortFn) => {
    if (abortPrev) abortPrev();

    // If we're not looking at the search results tab, dont both updating
    if (getNavigationPage() !== 'search') return null;

    const query = getQuery();
    const shouldRunSearch = query.length <= 1 ? scheduleFirstKey() : scheduleSubsequentKeys();
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
