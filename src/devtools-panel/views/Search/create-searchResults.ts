import { createEffect, createSignal, onCleanup, snapshot } from 'solid-js';

import { getLatestId, getLatestState } from '@/devtools-panel/store/game-state';
import { getPassageData } from '@/devtools-panel/store/passages';
import { createGetViewState, getNavigationPage } from '@/devtools-panel/store/store';
import type { ParsedPassageData, SearchResultsCombined } from '@/shared/shared-types';

import { createScheduled, scheduleIdle, throttle } from '../../utils/scheduled';
import { findPassageMatches, findStateMatches } from './search-utils';

const EMPTY: SearchResultsCombined = { state: [], passage: [] };

/**
 * New diffs make the results stale, but a running game changes its state all the time and searching
 * all of it again for each change would keep the page busy. So the results are refreshed at most
 * this often. Typing is not held back by it.
 */
const REFRESH_MS = 1000;

export function createSearchResults() {
  const getQuery = createGetViewState('search', 'query');
  const scheduleSearch = createScheduled((fn) => scheduleIdle(fn));

  const [getSearchResults, setSearchResults] = createSignal<SearchResultsCombined>(EMPTY);
  let abortCurrent: (() => void) | undefined;

  function search(query: string, passages: ParsedPassageData[]) {
    abortCurrent?.();
    const [statePromise, stateAbort] = findStateMatches(snapshot(getLatestState()), query);
    const [passagePromise, passageAbort] = findPassageMatches(passages, query);

    let alive = true;
    abortCurrent = () => {
      alive = false;
      stateAbort();
      passageAbort('Updated search');
    };

    Promise.all([statePromise, passagePromise])
      .then(([state, passage]) => {
        if (alive) setSearchResults({ state, passage });
      })
      .catch(() => {});
  }

  createEffect(
    () => ({
      page: getNavigationPage(),
      query: getQuery(),
      shouldRunSearch: scheduleSearch(),
      passages: getPassageData(),
    }),
    ({ page, query, shouldRunSearch, passages }) => {
      if (page !== 'search') return;

      if (!query) {
        abortCurrent?.();
        setSearchResults(EMPTY);
      } else if (shouldRunSearch) {
        search(query, passages);
      }
    },
  );

  const refresh = throttle(() => {
    if (getNavigationPage() === 'search' && getQuery()) search(getQuery(), getPassageData());
  }, REFRESH_MS);

  createEffect(
    () => getLatestId(),
    (_, previousId) => {
      if (previousId !== undefined) refresh();
    },
  );

  onCleanup(() => abortCurrent?.());

  return getSearchResults;
}
