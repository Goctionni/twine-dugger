import { describe, expect, it } from 'vite-plus/test';

import type { ParsedPassageData } from '@/shared/shared-types';

import {
  createDefaultOptions,
  type QueryMatcher,
  type PassageScope,
  type SearchOptions,
} from '../types';
import { countPassageMatches, countTags, searchPassages } from './passage-search';
import { createQueryMatcher } from './query-matcher';

const passage = (
  id: number,
  name: string,
  content: string,
  tags: string[] = [],
): ParsedPassageData => ({ id, name, content, tags, size: null, position: null });

const passages = [
  passage(1, 'Intro', 'nothing to see'),
  passage(2, 'Kitchen', 'the cat sleeps. the cat wakes', ['room', 'indoor']),
  passage(3, 'Cat Cafe', 'coffee', ['room']),
  passage(4, 'Garden', 'a cat outside', ['outdoor']),
  passage(5, 'Shed', 'tools', ['cat-free']),
];

const q = (searchText: string): QueryMatcher => {
  const result = createQueryMatcher({ searchText, options: createDefaultOptions() });
  if (!result.ok) throw new Error('expected a valid search');
  return result.queryMatcher;
};
const scope = (overrides: Partial<PassageScope> = {}): PassageScope => ({
  name: true,
  tags: true,
  content: true,
  ...overrides,
});

/** A search with nothing before it */
const searchAll = (
  source: readonly ParsedPassageData[],
  queryMatcher: QueryMatcher,
  searchScope: PassageScope,
) => searchPassages(undefined, source, queryMatcher, searchScope);

describe('searchPassages', () => {
  it('puts matches in the name or tags before matches that are only in the content', () => {
    const { hits } = searchAll(passages, q('cat'), scope());
    expect(hits.map((hit) => hit.key)).toEqual([3, 5, 2, 4]);
  });

  it('records where it matched', () => {
    const { hits } = searchAll(passages, q('cat'), scope());
    expect(hits[0]).toMatchObject({
      key: 3,
      nameRanges: [[0, 3]],
      tagRanges: [[]],
      firstContentRange: null,
    });
    expect(hits[1]).toMatchObject({ key: 5, nameRanges: [], tagRanges: [[[0, 3]]] });
  });

  it('gives the content details for a name match too', () => {
    const { hits } = searchAll([passage(1, 'cat', 'a cat, a cat')], q('cat'), scope());
    expect(hits[0]).toMatchObject({ nameRanges: [[0, 3]], firstContentRange: [2, 5] });
  });

  it('keeps the first match in the content', () => {
    const { hits } = searchAll(passages, q('cat'), scope());
    expect(hits.find((hit) => hit.key === 2)).toMatchObject({ firstContentRange: [4, 7] });
  });

  it('only searches what the scope allows', () => {
    const keys = (s: Partial<PassageScope>) =>
      searchAll(passages, q('cat'), scope(s)).hits.map((hit) => hit.key);
    const none = { name: false, tags: false, content: false };
    expect(keys({ ...none, name: true })).toEqual([3]);
    expect(keys({ ...none, tags: true })).toEqual([5]);
    expect(keys({ ...none, content: true })).toEqual([2, 4]);
    expect(keys(none)).toEqual([]);
  });

  it('counts the tags of the passages found, once per passage', () => {
    const { passages: found } = searchAll(passages, q('cat'), scope());
    expect(Object.fromEntries(countTags(found))).toEqual({
      'room': 2,
      'indoor': 1,
      'outdoor': 1,
      'cat-free': 1,
    });
  });

  it('returns the passages of the hits, in the order they were given, to narrow from', () => {
    const wide = searchAll(passages, q('c'), scope());
    expect(wide.passages.map((p) => p.id)).toEqual(
      wide.hits.map((hit) => hit.key).toSorted((a, b) => a - b),
    );

    const narrow = searchPassages(wide, passages, q('cat'), scope());
    const fromScratch = searchAll(passages, q('cat'), scope());
    expect(narrow.hits).toEqual(fromScratch.hits);
    expect(narrow.passages).toEqual(fromScratch.passages);
  });

  it('finds nothing without a match', () => {
    expect(searchAll(passages, q('zzz'), scope()).hits).toEqual([]);
  });

  it('copes with passages that have no tags field', () => {
    const odd = { ...passage(9, 'x', 'y'), tags: undefined as unknown as string[] };
    expect(searchAll([odd], q('x'), scope()).hits).toHaveLength(1);
  });
});

describe('countPassageMatches', () => {
  const kitchen = passages[1]!;
  const countFor = (searchText: string, onlyScope: Partial<PassageScope> = {}) => {
    const queryMatcher = q(searchText);
    const hit = searchAll([kitchen], queryMatcher, scope()).hits[0]!;
    return countPassageMatches(hit, kitchen.content, queryMatcher, scope(onlyScope));
  };

  it('counts the matches in the name, the tags and the content', () => {
    // 'room' is one of the tags
    expect(countFor('room')).toBe(1);
    // Twice in the content
    expect(countFor('cat')).toBe(2);
    // 'k' is in the name (Kitchen) and once in the content (wakes)
    expect(countFor('k')).toBe(2);
  });

  it('leaves the content out when it is not searched', () => {
    expect(countFor('cat', { content: false })).toBe(0);
  });
});

describe('searchPassages, after another search', () => {
  // The name is the only thing that is looked at, so the queryMatcher is asked once per passage that is searched
  const nameOnly = scope({ tags: false, content: false });
  const counted = (searchText: string, options: Partial<SearchOptions> = {}) => {
    const result = createQueryMatcher({
      searchText,
      options: { ...createDefaultOptions(), ...options },
    });
    if (!result.ok) throw new Error('expected a valid search');
    const searched = { count: 0 };
    const queryMatcher: QueryMatcher = {
      ...result.queryMatcher,
      ranges: (text, max) => (searched.count++, result.queryMatcher.ranges(text, max)),
    };
    return { queryMatcher, searched };
  };

  it('searches all the passages when there is nothing before it', () => {
    const { queryMatcher, searched } = counted('c');
    searchPassages(undefined, passages, queryMatcher, nameOnly);
    expect(searched.count).toBe(passages.length);
  });

  it('finds nothing without a queryMatcher, and does not start from that', () => {
    const none = searchPassages(undefined, passages, null, nameOnly);
    expect(none).toMatchObject({ hits: [], passages: [], queryMatcher: null });

    const { queryMatcher, searched } = counted('c');
    searchPassages(none, passages, queryMatcher, nameOnly);
    expect(searched.count).toBe(passages.length);
  });

  it('starts from the passages the previous search found when the search text grows', () => {
    const first = searchPassages(undefined, passages, counted('c').queryMatcher, nameOnly);
    const { queryMatcher, searched } = counted('ca');
    const narrowed = searchPassages(first, passages, queryMatcher, nameOnly);
    expect(searched.count).toBe(first.passages.length);
    expect(searched.count).toBeLessThan(passages.length);

    const fromScratch = searchPassages(undefined, passages, counted('ca').queryMatcher, nameOnly);
    expect(narrowed.hits).toEqual(fromScratch.hits);
  });

  it('keeps narrowing from what the last search looked at', () => {
    const first = searchPassages(undefined, passages, counted('c').queryMatcher, nameOnly);
    const second = searchPassages(first, passages, counted('ca').queryMatcher, nameOnly);
    const { queryMatcher, searched } = counted('cat');
    searchPassages(second, passages, queryMatcher, nameOnly);
    expect(searched.count).toBe(second.passages.length);
  });

  describe('searches all the passages again', () => {
    const first = () => searchPassages(undefined, passages, counted('ca').queryMatcher, nameOnly);
    const examinedWith = (
      queryMatcher: ReturnType<typeof counted>,
      source = passages,
      searchScope = nameOnly,
    ) => {
      searchPassages(first(), source, queryMatcher.queryMatcher, searchScope);
      return queryMatcher.searched.count;
    };

    it('for another search text', () => {
      expect(examinedWith(counted('ke'))).toBe(passages.length);
    });

    it('for a whole word or a regex', () => {
      expect(examinedWith(counted('cat', { wholeWord: true }))).toBe(passages.length);
      expect(examinedWith(counted('cat', { regex: true }))).toBe(passages.length);
    });

    it('when case sensitivity is switched off', () => {
      const previous = searchPassages(
        undefined,
        passages,
        counted('Ca', { caseSensitive: true }).queryMatcher,
        nameOnly,
      );
      const { queryMatcher, searched } = counted('Cat');
      searchPassages(previous, passages, queryMatcher, nameOnly);
      expect(searched.count).toBe(passages.length);
    });

    it('for another scope', () => {
      expect(examinedWith(counted('cat'), passages, scope({ tags: false }))).toBe(passages.length);
    });

    it('for other passages', () => {
      const others = passages.slice();
      expect(examinedWith(counted('cat'), others)).toBe(others.length);
    });
  });
});
