import { createMemo, untrack, type Accessor } from 'solid-js';

import type { ParsedPassageData } from '@/shared/shared-types';

import { searchPassages } from '../core/passage-search';
import { canNarrow } from '../core/query';
import { searchState } from '../core/state-search';
import type {
  Matcher,
  PassageScope,
  PassageSearchResult,
  SearchQuery,
  StateHit,
  StateScope,
} from '../core/types';
import type { SearchData } from '../types';

const NO_PASSAGES: PassageSearchResult = { hits: [], passages: [] };
const NO_STATE: StateHit[] = [];

const sameFlags = <T extends object>(a: T, b: T) =>
  (Object.keys(a) as Array<keyof T>).every((key) => a[key] === b[key]);

/** A copy of the part of the scope that this stage looks at, which stays the same object while its flags do */
const createStableScope = <T extends object>(read: Accessor<T>) =>
  createMemo<T>(() => ({ ...read() }), { equals: sameFlags });

interface StageInput<TScope> {
  /** The search as it was when `matcher` was made: what a narrower search compares with */
  query: Accessor<SearchQuery>;
  /** Null when there is nothing to search for, or the search is not valid */
  matcher: Accessor<Matcher | null>;
  scope: Accessor<TScope>;
}

/**
 * The passages that match. Searches again when the search, the passage scope or the passages
 * change, and starts from the passages the previous search found when that is enough.
 */
export function createPassageStage({
  passages,
  query,
  matcher,
  scope,
}: StageInput<PassageScope> & { passages: Accessor<readonly ParsedPassageData[]> }) {
  const stableScope = createStableScope(scope);

  // What the previous search looked at and found, to know if it can be searched again
  let previous:
    | {
        query: SearchQuery;
        scope: PassageScope;
        source: readonly ParsedPassageData[];
        found: readonly ParsedPassageData[];
      }
    | undefined;

  return createMemo<PassageSearchResult>(() => {
    const current = matcher();
    const currentQuery = query();
    const currentScope = stableScope();
    const source = passages();
    if (!current) {
      previous = undefined;
      return NO_PASSAGES;
    }

    // What matches a longer search also matches a shorter one, so the previous hits are enough
    const canStartFromPrevious =
      previous &&
      previous.source === source &&
      sameFlags(previous.scope, currentScope) &&
      canNarrow(previous.query, currentQuery);
    const result = searchPassages(
      canStartFromPrevious ? previous!.found : source,
      current,
      currentScope,
    );
    previous = { query: currentQuery, scope: currentScope, source, found: result.passages };
    return result;
  });
}

/** The state that matches. Searches again when the search, the state scope or the state change */
export function createStateStage({
  data,
  matcher,
  scope,
}: Omit<StageInput<StateScope>, 'query'> & { data: SearchData }) {
  const stableScope = createStableScope(scope);

  return createMemo<StateHit[]>(() => {
    const current = matcher();
    const currentScope = stableScope();
    data.stateVersion();
    if (!current) return NO_STATE;
    return searchState(untrack(data.getState), current, currentScope);
  });
}
