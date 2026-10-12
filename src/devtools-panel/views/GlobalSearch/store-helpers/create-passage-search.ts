import { createMemo, createProjection, type Accessor } from 'solid-js';

import { getPassageData } from '../../../store/passages';
import { countPassageMatches, countTags, searchPassages } from '../logic/passage-search';
import { rankNames, sortPassageHits } from '../logic/sort';
import type { PassageMatcherHit, PassageScope, PassageSearch, QueryMatcher } from '../types';
import { createDefaultScope } from '../utils/search-defaults';
import { getScope, getSort, getTagFilter } from './search-state';

export function createPassageSearch(getQueryMatcher: Accessor<QueryMatcher | null>) {
  // A flag only notifies when it changes: resetting the filters makes a new scope with the same
  // flags, and that must not search again
  const scope = createProjection<PassageScope>((draft) => {
    Object.assign(draft, getScope().passage);
  }, createDefaultScope().passage);

  // Starts from the passages the previous search found when that is enough
  const found = createMemo((previous: PassageSearch | undefined) =>
    searchPassages(previous, getPassageData(), getQueryMatcher(), scope),
  );

  const getPassageById = createMemo(() => new Map(getPassageData().map((p) => [p.id, p])));

  const filtered = createMemo(() => {
    const hits = found().hits;
    const tags = getTagFilter();
    if (!tags.length) return hits;
    const passageById = getPassageById();
    return hits.filter((hit) => passageById.get(hit.key)?.tags?.some((tag) => tags.includes(tag)));
  });

  // Only made when a name sort asks for it
  const getNameRanks = createMemo(() => rankNames(getPassageData()));

  // A new array whenever the results change: it tells the virtual list that the keys at its
  // positions may have changed
  const sorted = createMemo<PassageMatcherHit[]>(() =>
    sortPassageHits(filtered(), getSort().passage, {
      getNameRank: (id) => getNameRanks().get(id) ?? 0,
      // Counting every match in every passage is real work: only asked for when sorting by matches
      getMatchCount: (hit) => {
        const queryMatcher = getQueryMatcher();
        const content = getPassageById().get(hit.key)?.content;
        return queryMatcher ? countPassageMatches(hit, content, queryMatcher, scope) : 0;
      },
    }),
  );

  // Counted when a filter that shows them is on the page, not for every search
  const getTagCounts = createMemo(() => countTags(found().passages));

  return {
    /** Filtered and sorted */
    getPassageHits: sorted,
    /** Found, before the filters */
    getPassageTotal: () => found().hits.length,
    getTagCounts,
    getPassage: (id: number) => getPassageById().get(id),
    getSearchesPassageContent: () => scope.content,
  };
}
