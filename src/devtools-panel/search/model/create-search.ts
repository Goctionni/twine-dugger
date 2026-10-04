import { createMemo, createProjection, untrack, type Accessor } from 'solid-js';

import type { JSONSafeObject, ParsedPassageData } from '@/shared/shared-types';

import { searchPassages, type PassageSearchResult } from '../core/passage-search';
import { canNarrow, compileQuery, queryKey, type CompiledQuery } from '../core/query';
import { sortPassageHits, sortStateHits } from '../core/sort';
import { searchState, type StateSearchResult } from '../core/state-search';
import type { PassageHit, StateHit } from '../core/types';
import {
  getOptions,
  getQuery,
  getScope,
  getSort,
  getTagFilter,
  getTypeFilter,
} from './search-state';
import { createSelection } from './selection';

/** Where the search reads from.  is the game that is being inspected */
export interface SearchData {
  passages: Accessor<readonly ParsedPassageData[]>;
  /** Changes whenever the state does, so the state is searched again */
  stateVersion: Accessor<number>;
  /** The state as plain data. Reading it is not tracked; `stateVersion` says when to look again */
  getState: () => JSONSafeObject;
  /** Higher = changed more recently */
  getLastChange: (key: string) => number;
}

interface PassageStage extends PassageSearchResult {
  query: CompiledQuery | null;
  scope: PassageScope;
  /** What was searched, to know if what was found can be searched again */
  source: readonly ParsedPassageData[];
}
type PassageScope = { passageName: boolean; passageTags: boolean; passageContent: boolean };
type StateScope = { statePath: boolean; stateValue: boolean };

const NO_PASSAGES: PassageStage = {
  hits: [],
  passages: [],
  tagCounts: new Map(),
  query: null,
  scope: { passageName: false, passageTags: false, passageContent: false },
  source: [],
};
const NO_STATE: StateSearchResult = { hits: [], typeCounts: {} };

const sameFlags = <T extends Record<string, boolean>>(a: T, b: T) =>
  Object.keys(a).every((key) => a[key] === b[key]);

/**
 * The search results, as a pipeline of steps that each only look at what they depend on:
 *
 *   query + options ─► compiled ─┬─► passages found ─► filtered + sorted ─► passageList
 *                                └─► state found    ─► filtered + sorted ─► stateList
 *
 * Passages are only searched again when the query, the passage scope or the passages change, and the
 * state only when the query, the state scope or the state change. Filtering and sorting work on what
 * was found. The lists keep a hit that is still there as the same object, so its row stays as it is.
 */
export function createSearch(data: SearchData) {
  // The key is the same for the same search, so what depends on it doesn't run for nothing
  const key = createMemo(() => queryKey(getQuery(), getOptions()));
  const compiled = createMemo(() => {
    key();
    return untrack(() => compileQuery(getQuery(), { ...getOptions() }));
  });
  const query = createMemo(() => {
    const current = compiled();
    return current?.ok ? current : null;
  });
  const error = createMemo(() => {
    const current = compiled();
    return current && !current.ok ? current.error : null;
  });

  const passageScope = createMemo<PassageScope>(
    () => {
      const { passageName, passageTags, passageContent } = getScope();
      return { passageName, passageTags, passageContent };
    },
    { equals: sameFlags },
  );
  const stateScope = createMemo<StateScope>(
    () => {
      const { statePath, stateValue } = getScope();
      return { statePath, stateValue };
    },
    { equals: sameFlags },
  );

  const passageStage = createMemo<PassageStage>((previous) => {
    const current = query();
    const scope = passageScope();
    const source = data.passages();
    if (!current) return NO_PASSAGES;

    // What matches a longer query also matches a shorter one, so the previous hits are enough
    const narrowing =
      previous?.query &&
      previous.source === source &&
      sameFlags(previous.scope, scope) &&
      canNarrow(previous.query, current);
    const result = searchPassages(narrowing ? previous.passages : source, current, {
      ...scope,
      statePath: false,
      stateValue: false,
    });
    return { ...result, query: current, scope, source };
  });

  const stateStage = createMemo<StateSearchResult>(() => {
    const current = query();
    const scope = stateScope();
    data.stateVersion();
    if (!current) return NO_STATE;
    return searchState(untrack(data.getState), current, {
      ...scope,
      passageName: false,
      passageTags: false,
      passageContent: false,
    });
  });

  const passageById = createMemo(() => new Map(data.passages().map((p) => [p.id, p])));

  // The order is a plain array that is new every time the results change. The lists below keep
  // the hits that are still there as the same objects, and the order tells a virtual list that the
  // keys at its positions may have changed
  const passageOrder = createMemo<PassageHit[]>(() => {
    const hits = passageStage().hits;
    const tags = getTagFilter();
    const byId = passageById();
    const filtered = tags.length
      ? hits.filter((hit) => byId.get(hit.key)?.tags?.some((tag) => tags.includes(tag)))
      : hits;
    return sortPassageHits(filtered, getSort().passage, (id) => byId.get(id)?.name ?? '');
  });
  const passageList = createProjection<PassageHit[]>(() => passageOrder(), [], { key: 'key' });

  const stateOrder = createMemo<StateHit[]>(() => {
    const hits = stateStage().hits;
    const types = getTypeFilter();
    const filtered = types.length ? hits.filter((hit) => types.includes(hit.type)) : hits;
    // The state is searched again whenever it changes, so this doesn't need to track the changes
    const sort = getSort().state;
    return untrack(() => sortStateHits(filtered, sort, data.getLastChange));
  });
  const stateList = createProjection<StateHit[]>(() => stateOrder(), [], { key: 'key' });

  return {
    /** Why the query can't be searched for (an invalid regex), if so */
    error,
    /** Whether there is something to search for */
    hasQuery: () => query() !== null,
    passageList,
    passageOrder,
    stateList,
    stateOrder,
    /** Found, before the filters. The lists have what is left of it */
    passageTotal: () => passageStage().hits.length,
    stateTotal: () => stateStage().hits.length,
    /** How many of what was found have each tag, and each type: for the filters */
    tagCounts: () => passageStage().tagCounts,
    typeCounts: () => stateStage().typeCounts,
    /** Looks up a passage by id: for the parts that show more than the hit has */
    getPassage: (id: number) => passageById().get(id),
    selection: createSelection(),
  };
}
export type SearchModel = ReturnType<typeof createSearch>;
