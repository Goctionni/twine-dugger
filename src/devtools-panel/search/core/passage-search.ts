import type { ParsedPassageData } from '@/shared/shared-types';

import type { CompiledQuery } from './query';
import type { PassageHit, Range, SearchScope } from './types';

export interface PassageSearchResult {
  /** Best match first: matches in the name or tags, then the ones that only match in the content */
  hits: PassageHit[];
  /** The passages the hits are about, in the order they were given. This is what a narrower search starts from */
  passages: ParsedPassageData[];
  /** How many hits have each tag */
  tagCounts: Map<string, number>;
}

const NO_RANGES: Range[] = [];

/**
 * `passages` can be everything, or what a broader query matched: this does not know the difference.
 * The names and tags are checked first, the content (the expensive part) only for the rest.
 */
export function searchPassages(
  passages: readonly ParsedPassageData[],
  query: CompiledQuery,
  scope: SearchScope,
): PassageSearchResult {
  const titleHits: PassageHit[] = [];
  const contentHits: PassageHit[] = [];

  const searchContent = (passage: ParsedPassageData) => {
    if (!scope.passageContent) return { content: null, contentCount: 0 };
    const content = query.first(passage.content);
    return { content, contentCount: content ? query.count(passage.content) : 0 };
  };

  const unmatched = new Uint8Array(passages.length);
  if (scope.passageName || scope.passageTags) {
    for (let i = 0; i < passages.length; i++) {
      const passage = passages[i]!;
      const name = scope.passageName ? query.ranges(passage.name) : NO_RANGES;
      let tags: Range[][] = [];
      if (scope.passageTags && passage.tags?.length) {
        tags = passage.tags.map((tag) => query.ranges(tag));
      }

      if (name.length || tags.some((ranges) => ranges.length)) {
        titleHits.push({ key: passage.id, name, tags, ...searchContent(passage) });
      } else {
        unmatched[i] = 1;
      }
    }
  } else {
    unmatched.fill(1);
  }

  if (scope.passageContent) {
    for (let i = 0; i < passages.length; i++) {
      if (!unmatched[i]) continue;
      const passage = passages[i]!;
      const content = query.first(passage.content);
      if (!content) continue;
      contentHits.push({
        key: passage.id,
        name: NO_RANGES,
        tags: [],
        content,
        contentCount: query.count(passage.content),
      });
      unmatched[i] = 0;
    }
  }

  // Not in the order of the hits: a narrower search must find them in the same order as a new one
  const resultPassages = passages.filter((_, i) => !unmatched[i]);
  const tagCounts = new Map<string, number>();
  for (const passage of resultPassages) {
    for (const tag of new Set(passage.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  return { hits: [...titleHits, ...contentHits], passages: resultPassages, tagCounts };
}
