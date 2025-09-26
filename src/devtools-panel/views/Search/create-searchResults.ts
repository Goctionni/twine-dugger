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

export function createSearchResults() {
  const getQuery = createGetViewState('search', 'query');

  const [getSearchResults, setSearchResults] = createSignal<SearchResultsCombined>(EMPTY);

  createEffect((abortPrev: null | AbortFn) => {
    if (abortPrev) abortPrev();

    // If we're not looking at the search results tab, dont both updating
    if (getNavigationPage() !== 'search') return null;

    const query = getQuery();
    const gameState = getLatestStateFrame();
    if (!query || !gameState) {
      setSearchResults(EMPTY);
      return null;
    }

    const [statePromise, stateAbort] = findStateMatches(gameState.state, query);
    const [passagePromise, passageAbort] = findPassageMatches(getPassageData(), query);

    let alive = true;
    const abortCurr = () => {
      alive = false;
      stateAbort();
      passageAbort();
    };

    Promise.all([statePromise, passagePromise]).then(([state, passage]) => {
      if (!alive) return;
      setSearchResults({ state, passage });
    });

    return abortCurr;
  }, null);

  return getSearchResults;
}
