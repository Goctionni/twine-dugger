import { describe, expect, it } from 'vite-plus/test';

import type { ParsedPassageData } from '@/shared/shared-types';

import { createMatcher } from '../ui/SearchBar/matcher';
import { countPassageMatches, countTags, searchPassages } from './passage-search';
import { createDefaultOptions, type Matcher, type PassageScope } from './types';

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

const q = (searchText: string): Matcher => {
  const result = createMatcher({ searchText, options: createDefaultOptions() });
  if (!result.ok) throw new Error('expected a valid search');
  return result.matcher;
};
const scope = (overrides: Partial<PassageScope> = {}): PassageScope => ({
  name: true,
  tags: true,
  content: true,
  ...overrides,
});

describe('searchPassages', () => {
  it('puts matches in the name or tags before matches that are only in the content', () => {
    const { hits } = searchPassages(passages, q('cat'), scope());
    expect(hits.map((hit) => hit.key)).toEqual([3, 5, 2, 4]);
  });

  it('records where it matched', () => {
    const { hits } = searchPassages(passages, q('cat'), scope());
    expect(hits[0]).toMatchObject({
      key: 3,
      nameRanges: [[0, 3]],
      tagRanges: [[]],
      firstContentRange: null,
    });
    expect(hits[1]).toMatchObject({ key: 5, nameRanges: [], tagRanges: [[[0, 3]]] });
  });

  it('gives the content details for a name match too', () => {
    const { hits } = searchPassages([passage(1, 'cat', 'a cat, a cat')], q('cat'), scope());
    expect(hits[0]).toMatchObject({ nameRanges: [[0, 3]], firstContentRange: [2, 5] });
  });

  it('keeps the first match in the content', () => {
    const { hits } = searchPassages(passages, q('cat'), scope());
    expect(hits.find((hit) => hit.key === 2)).toMatchObject({ firstContentRange: [4, 7] });
  });

  it('only searches what the scope allows', () => {
    const keys = (s: Partial<PassageScope>) =>
      searchPassages(passages, q('cat'), scope(s)).hits.map((hit) => hit.key);
    const none = { name: false, tags: false, content: false };
    expect(keys({ ...none, name: true })).toEqual([3]);
    expect(keys({ ...none, tags: true })).toEqual([5]);
    expect(keys({ ...none, content: true })).toEqual([2, 4]);
    expect(keys(none)).toEqual([]);
  });

  it('counts the tags of the passages found, once per passage', () => {
    const { passages: found } = searchPassages(passages, q('cat'), scope());
    expect(Object.fromEntries(countTags(found))).toEqual({
      'room': 2,
      'indoor': 1,
      'outdoor': 1,
      'cat-free': 1,
    });
  });

  it('returns the passages of the hits, in the order they were given, to narrow from', () => {
    const wide = searchPassages(passages, q('c'), scope());
    expect(wide.passages.map((p) => p.id)).toEqual(
      wide.hits.map((hit) => hit.key).toSorted((a, b) => a - b),
    );

    const narrow = searchPassages(wide.passages, q('cat'), scope());
    expect(narrow).toEqual(searchPassages(passages, q('cat'), scope()));
  });

  it('finds nothing without a match', () => {
    expect(searchPassages(passages, q('zzz'), scope()).hits).toEqual([]);
  });

  it('copes with passages that have no tags field', () => {
    const odd = { ...passage(9, 'x', 'y'), tags: undefined as unknown as string[] };
    expect(searchPassages([odd], q('x'), scope()).hits).toHaveLength(1);
  });
});

describe('countPassageMatches', () => {
  const kitchen = passages[1]!;
  const countFor = (searchText: string, onlyScope: Partial<PassageScope> = {}) => {
    const matcher = q(searchText);
    const hit = searchPassages([kitchen], matcher, scope()).hits[0]!;
    return countPassageMatches(hit, kitchen.content, matcher, scope(onlyScope));
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
