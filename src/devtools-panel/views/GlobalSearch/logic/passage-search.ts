import { sameFlags } from '@/devtools-panel/utils/same-flags';
import type { ParsedPassageData } from '@/shared/shared-types';

import type { PassageMatcherHit, PassageScope, PassageSearch, QueryMatcher, Range } from '../types';

const NO_RANGES: Range[] = [];

/**
 * `passages` can be everything, or what a broader search matched: this does not know the difference.
 * The names and tags are checked first, the content (the expensive part) only for the rest.
 */
function naiveSearchPassages(
  passages: readonly ParsedPassageData[],
  queryMatcher: QueryMatcher,
  scope: PassageScope,
): Pick<PassageSearch, 'hits' | 'passages'> {
  const firstInContent = (passage: ParsedPassageData) =>
    scope.content ? queryMatcher.first(passage.content) : null;

  const titleHits: PassageMatcherHit[] = [];
  const rest: ParsedPassageData[] = [];
  for (const passage of passages) {
    const nameRanges = scope.name ? queryMatcher.ranges(passage.name) : NO_RANGES;
    const tagRanges = scope.tags ? (passage.tags ?? []).map((tag) => queryMatcher.ranges(tag)) : [];
    if (nameRanges.length || tagRanges.some((ranges) => ranges.length)) {
      titleHits.push({
        key: passage.id,
        nameRanges,
        tagRanges,
        firstContentRange: firstInContent(passage),
      });
    } else {
      rest.push(passage);
    }
  }

  const contentHits: PassageMatcherHit[] = [];
  if (scope.content) {
    for (const passage of rest) {
      const firstContentRange = firstInContent(passage);
      if (firstContentRange) {
        contentHits.push({
          key: passage.id,
          nameRanges: NO_RANGES,
          tagRanges: [],
          firstContentRange,
        });
      }
    }
  }

  const hits = [...titleHits, ...contentHits];
  // In the order they were given, not the order of the hits: a narrower search must find them in the
  // same order as a new one
  const found = new Set(hits.map((hit) => hit.key));
  return { hits, passages: passages.filter((passage) => found.has(passage.id)) };
}

/** Whether what the `previous` search found is enough to search in: it looked at the same passages in the same way, and the new search is a narrower one */
function canNarrowFrom(
  previous: PassageSearch | undefined,
  source: readonly ParsedPassageData[],
  queryMatcher: QueryMatcher,
  scope: PassageScope,
): previous is PassageSearch & { queryMatcher: QueryMatcher } {
  return (
    !!previous?.queryMatcher &&
    previous.source === source &&
    sameFlags(previous.scope, scope) &&
    queryMatcher.canNarrowFrom(previous.queryMatcher)
  );
}

/**
 * Searches the passages, starting from the passages the `previous` search found when that is
 * enough: what matches a longer search also matches a shorter one.
 */
export function searchPassages(
  previous: PassageSearch | undefined,
  source: readonly ParsedPassageData[],
  queryMatcher: QueryMatcher | null,
  scope: PassageScope,
): PassageSearch {
  // A copy: the scope can be a store that changes, the next search compares with what this one saw,
  // and reading a store for every passage is slower than reading an object
  const searched = { ...scope };
  if (!queryMatcher) return { hits: [], passages: [], queryMatcher, scope: searched, source };
  const passages = canNarrowFrom(previous, source, queryMatcher, searched)
    ? previous.passages
    : source;
  const result = naiveSearchPassages(passages, queryMatcher, searched);
  return { ...result, queryMatcher, scope: searched, source };
}

/** Everywhere the search was found in a passage: name, tags and content. Counting the content is real work */
export function countPassageMatches(
  hit: PassageMatcherHit,
  content: string | undefined,
  queryMatcher: QueryMatcher,
  scope: PassageScope,
): number {
  const inTitle =
    hit.nameRanges.length + hit.tagRanges.reduce((sum, ranges) => sum + ranges.length, 0);
  return inTitle + (scope.content && content ? queryMatcher.count(content) : 0);
}

/** How many of the passages have each tag (a passage counts once per tag) */
export function countTags(passages: readonly ParsedPassageData[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const passage of passages) {
    for (const tag of new Set(passage.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return counts;
}
