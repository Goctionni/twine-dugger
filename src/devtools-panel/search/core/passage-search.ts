import type { ParsedPassageData } from '@/shared/shared-types';

import type { CompiledQuery, PassageHit, PassageScope, PassageSearchResult, Range } from './types';

const NO_RANGES: Range[] = [];

/**
 * `passages` can be everything, or what a broader query matched: this does not know the difference.
 * The names and tags are checked first, the content (the expensive part) only for the rest.
 */
export function searchPassages(
  passages: readonly ParsedPassageData[],
  query: CompiledQuery,
  scope: PassageScope,
): PassageSearchResult {
  const content = (passage: ParsedPassageData) => {
    const first = scope.passageContent ? query.first(passage.content) : null;
    return { content: first, contentCount: first ? query.count(passage.content) : 0 };
  };

  const titleHits: PassageHit[] = [];
  const rest: ParsedPassageData[] = [];
  for (const passage of passages) {
    const name = scope.passageName ? query.ranges(passage.name) : NO_RANGES;
    const tags = scope.passageTags ? (passage.tags ?? []).map((tag) => query.ranges(tag)) : [];
    if (name.length || tags.some((ranges) => ranges.length)) {
      titleHits.push({ key: passage.id, name, tags, ...content(passage) });
    } else {
      rest.push(passage);
    }
  }

  const contentHits: PassageHit[] = [];
  if (scope.passageContent) {
    for (const passage of rest) {
      const found = content(passage);
      if (found.content) contentHits.push({ key: passage.id, name: NO_RANGES, tags: [], ...found });
    }
  }

  const hits = [...titleHits, ...contentHits];
  // In the order they were given, not the order of the hits: a narrower search must find them in the
  // same order as a new one
  const found = new Set(hits.map((hit) => hit.key));
  const matched = passages.filter((passage) => found.has(passage.id));

  const tagCounts = new Map<string, number>();
  for (const passage of matched) {
    for (const tag of new Set(passage.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  return { hits, passages: matched, tagCounts };
}
