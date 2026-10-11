import { createMemo, createProjection, untrack } from 'solid-js';

import type { ParsedPassageData } from '@/shared/shared-types';

import { createMatcher } from '../core/matcher';
import { countPassageMatches, countTags } from '../core/passage-search';
import { queryKey } from '../core/query';
import { rankNames, sortPassageHits, sortStateHits } from '../core/sort';
import { countTypes } from '../core/state-search';
import type { PassageHit, Range, SearchQuery, StateHit } from '../core/types';
import type { SearchData, SearchInput } from '../types';
import { createPassageStage, createStateStage } from './stages';

/**
 * The search results, as a pipeline of steps that each only look at what they depend on:
 *
 *   query ─► matcher ─┬─► passages found ─► filtered + sorted ─► passageHits
 *                     └─► state found    ─► filtered + sorted ─► stateHits
 *
 * Passages are only searched again when the query, the passage scope or the passages change, and the
 * state only when the query, the state scope or the state change. Filtering and sorting work on what
 * was found. The hit lists keep a hit that is still there as the same object, so its row stays as it is.
 */
export function createSearch(data: SearchData, input: SearchInput) {
  // The key is the same for the same search, so what depends on it doesn't run for nothing
  const key = createMemo(() => queryKey(input.query()));
  // A copy: what was searched for must not change when the input does, before the key says so
  const query = createMemo<SearchQuery>(() => {
    key();
    return untrack(() => {
      const { searchText, options } = input.query();
      return { searchText, options: { ...options } };
    });
  });
  const matcherResult = createMemo(() => (query().searchText ? createMatcher(query()) : null));
  const matcher = createMemo(() => {
    const result = matcherResult();
    return result?.ok ? result.matcher : null;
  });
  const error = createMemo(() => {
    const result = matcherResult();
    return result && !result.ok ? result.error : null;
  });

  const passageScope = () => input.scope().passage;
  const stateScope = () => input.scope().state;
  const passageStage = createPassageStage({
    passages: data.passages,
    query,
    matcher,
    scope: passageScope,
  });
  const stateStage = createStateStage({ data, matcher, scope: stateScope });

  const passageById = createMemo(() => new Map(data.passages().map((p) => [p.id, p])));

  // Ranked when it is first needed, and again when the passages are other passages
  let nameRanks: { source: readonly ParsedPassageData[]; ranks: Map<number, number> } | undefined;
  const getNameRank = (id: number) => {
    const source = data.passages();
    if (nameRanks?.source !== source) nameRanks = { source, ranks: rankNames(source) };
    return nameRanks.ranks.get(id) ?? 0;
  };

  // The sorted hits are a plain array that is new every time the results change. The hits lists
  // below keep the hits that are still there as the same objects, and the array tells a virtual list
  // that the keys at its positions may have changed
  const sortedPassageHits = createMemo<PassageHit[]>(() => {
    const hits = passageStage().hits;
    const tags = input.tagFilter();
    const byId = passageById();
    const filtered = tags.length
      ? hits.filter((hit) => byId.get(hit.key)?.tags?.some((tag) => tags.includes(tag)))
      : hits;
    return sortPassageHits(filtered, input.sort().passage, {
      getNameRank,
      // Only asked for when sorting by matches: counting every match in every passage is real work
      getMatchCount: (hit) => {
        const current = matcher();
        const content = byId.get(hit.key)?.content;
        return current ? countPassageMatches(hit, content, current, passageScope()) : 0;
      },
    });
  });
  const passageHits = createProjection<PassageHit[]>(() => sortedPassageHits(), [], { key: 'key' });

  const sortedStateHits = createMemo<StateHit[]>(() => {
    const hits = stateStage();
    const types = input.typeFilter();
    const filtered = types.length ? hits.filter((hit) => types.includes(hit.type)) : hits;
    // The state is searched again whenever it changes, so this doesn't need to track the changes
    const sort = input.sort().state;
    return untrack(() => sortStateHits(filtered, sort, data.getLastChange));
  });
  const stateHits = createProjection<StateHit[]>(() => sortedStateHits(), [], { key: 'key' });

  // Counted when a filter that shows them is on the page, not for every search
  const tagCounts = createMemo(() => countTags(passageStage().passages));
  const typeCounts = createMemo(() => countTypes(stateStage()));

  return {
    /** Why the search text can't be searched for (an invalid regex), if so */
    error,
    /** Whether there is something to search for */
    hasQuery: () => matcher() !== null,
    /** What was found and is shown: the same object for a hit that stays, so this is what rows read */
    passageHits,
    stateHits,
    /** The same hits, as a plain array that is new whenever they change: this tells the keys apart */
    sortedPassageHits,
    sortedStateHits,
    /** Found, before the filters. The hits have what is left of it */
    passageTotal: () => passageStage().hits.length,
    stateTotal: () => stateStage().length,
    /** How many of what was found have each tag, and each type: for the filters */
    tagCounts,
    typeCounts,
    /** Looks up a passage by id: for the parts that show more than the hit has */
    getPassage: (id: number) => passageById().get(id),
    /** Where the search text is found in `text`, and how often: for marking it and for counting */
    findRanges: (text: string, max?: number): Range[] => matcher()?.ranges(text, max) ?? [],
    countMatches: (text: string) => matcher()?.count(text) ?? 0,
  };
}
