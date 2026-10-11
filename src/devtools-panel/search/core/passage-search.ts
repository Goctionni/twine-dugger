import type { ParsedPassageData } from '@/shared/shared-types';

import type { Matcher, PassageHit, PassageScope, PassageSearchResult, Range } from './types';

const NO_RANGES: Range[] = [];

/**
 * `passages` can be everything, or what a broader search matched: this does not know the difference.
 * The names and tags are checked first, the content (the expensive part) only for the rest.
 */
export function searchPassages(
  passages: readonly ParsedPassageData[],
  matcher: Matcher,
  scope: PassageScope,
): PassageSearchResult {
  const firstInContent = (passage: ParsedPassageData) =>
    scope.content ? matcher.first(passage.content) : null;

  const titleHits: PassageHit[] = [];
  const rest: ParsedPassageData[] = [];
  for (const passage of passages) {
    const nameRanges = scope.name ? matcher.ranges(passage.name) : NO_RANGES;
    const tagRanges = scope.tags ? (passage.tags ?? []).map((tag) => matcher.ranges(tag)) : [];
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

  const contentHits: PassageHit[] = [];
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

/** Everywhere the search was found in a passage: name, tags and content. Counting the content is real work */
export function countPassageMatches(
  hit: PassageHit,
  content: string | undefined,
  matcher: Matcher,
  scope: PassageScope,
): number {
  const inTitle =
    hit.nameRanges.length + hit.tagRanges.reduce((sum, ranges) => sum + ranges.length, 0);
  return inTitle + (scope.content && content ? matcher.count(content) : 0);
}

/** How many of the passages have each tag (a passage counts once per tag) */
export function countTags(passages: readonly ParsedPassageData[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const passage of passages) {
    for (const tag of new Set(passage.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return counts;
}
