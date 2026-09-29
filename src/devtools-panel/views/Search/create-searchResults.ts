import { createEffect, createSignal, onCleanup, snapshot, untrack } from 'solid-js';

import {
  createGetViewState,
  getLatestId,
  getLatestState,
  getNavigationPage,
  getPassageData,
} from '@/devtools-panel/store/store';
import type {
  ParsedPassageData,
  SearchResultsCombined,
  SearchResultState,
} from '@/shared/shared-types';

import { createScheduled, scheduleIdle, throttle } from '../../utils/scheduled';
import type { FindResult } from './search-utils';
import {
  canNarrowPassages,
  canNarrowState,
  findPassageMatches,
  findStateMatches,
  narrowPassageMatches,
  narrowStateMatches,
} from './search-utils';

type AbortFn = () => void;
const EMPTY: SearchResultsCombined = { state: [], passage: [] };

/**
 * New diffs make the search results stale, but the state changes constantly in a running game, and
 * searching all of it again each time would keep the page busy. So results are refreshed at most
 * this often. Typing is not held back by it.
 */
const REFRESH_MS = 1000;

const alreadyDone = <T>(results: T[]): FindResult<T> => [Promise.resolve(results), () => {}];

export function createSearchResults() {
  const getQuery = createGetViewState('search', 'query');
  const scheduleSearch = createScheduled((fn) => scheduleIdle(fn));

  const [getSearchResults, setSearchResults] = createSignal<SearchResultsCombined>(EMPTY);

  // What the results that are shown were made from. A longer query only needs to look at those,
  // instead of at everything again.
  let stateCache: { query: string; results: SearchResultState[] } | null = null;
  let passageCache: {
    query: string;
    passages: ParsedPassageData[];
    results: ParsedPassageData[];
  } | null = null;
  // Changes with the state, so that a search that was started before it changed isn't cached
  let stateVersion = 0;
  let abortCurrent: AbortFn | undefined;

  const clear = () => {
    abortCurrent?.();
    stateCache = passageCache = null;
    setSearchResults(EMPTY);
  };

  function search(query: string, passages: ParsedPassageData[]) {
    abortCurrent?.();
    const version = stateVersion;
    const previousState = stateCache;
    const previousPassages = passageCache;

    const [statePromise, stateAbort] =
      previousState && canNarrowState(previousState.query, query)
        ? alreadyDone(narrowStateMatches(previousState.results, query))
        : findStateMatches(snapshot(getLatestState()), query);

    const [passagePromise, passageAbort] =
      previousPassages?.passages === passages && canNarrowPassages(previousPassages.query, query)
        ? alreadyDone(narrowPassageMatches(previousPassages.results, query))
        : findPassageMatches(passages, query);

    let alive = true;
    abortCurrent = () => {
      alive = false;
      stateAbort();
      passageAbort('Updated search');
    };

    Promise.all([statePromise, passagePromise])
      .then(([state, passage]) => {
        if (!alive) return;
        if (version === stateVersion) stateCache = { query, results: state };
        passageCache = { query, passages, results: passage };
        setSearchResults({ state, passage });
      })
      .catch(() => {});
  }

  // Typing and changing the passages
  createEffect(
    () => ({
      page: getNavigationPage(),
      query: getQuery(),
      shouldRunSearch: scheduleSearch(),
      passages: getPassageData(),
    }),
    ({ page, query, shouldRunSearch, passages }) => {
      // If we're not looking at the search results tab, dont both updating
      if (page !== 'search') return;

      if (!query) return clear();
      if (shouldRunSearch) search(query, passages);
    },
  );

  // New diffs: the cached state results are stale, and the search is redone after a while
  const refresh = throttle(() => {
    if (getNavigationPage() !== 'search' || !getQuery()) return;
    search(getQuery(), getPassageData());
  }, REFRESH_MS);

  let seenId = untrack(getLatestId);
  createEffect(
    () => getLatestId(),
    (id) => {
      // Not for the diffs that were there before this search existed
      if (id === seenId) return;
      seenId = id;
      stateVersion++;
      stateCache = null;
      refresh();
    },
  );

  onCleanup(() => abortCurrent?.());

  return getSearchResults;
}
