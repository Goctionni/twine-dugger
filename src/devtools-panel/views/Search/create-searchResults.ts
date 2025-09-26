import { createEffect, createSignal } from 'solid-js';

import { createGetViewState, getLatestStateFrame, getPassageData } from '@/devtools-panel/store';
import { SearchResultsCombined } from '@/shared/shared-types';

import { findPassageMatches, findStateMatches } from './search-utils';

type AbortFn = () => void;

export function createSearchResults() {
  const getQuery = createGetViewState('search', 'query');

  const [getSearchResults, setSearchResults] = createSignal<SearchResultsCombined>({
    state: [],
    passage: [],
  });

  createEffect((abortPrev: null | AbortFn) => {
    if (abortPrev) abortPrev();

    const query = getQuery();
    if (!query) return null;
    const gameState = getLatestStateFrame();
    if (!gameState) return null;

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
