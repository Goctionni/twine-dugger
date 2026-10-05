import { describe, expect, it } from 'vite-plus/test';

import type { ParsedPassageData } from '@/shared/shared-types';

import { searchPassages } from './passage-search';
import { compileQuery } from './query';
import {
  defaultSearchOptions,
  defaultSearchScope,
  type CompiledQuery,
  type SearchScope,
} from './types';

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

const q = (text: string) => compileQuery(text, defaultSearchOptions) as CompiledQuery;
const scope = (overrides: Partial<SearchScope> = {}): SearchScope => ({
  ...defaultSearchScope,
  ...overrides,
});

describe('searchPassages', () => {
  it('puts matches in the name or tags before matches that are only in the content', () => {
    const { hits } = searchPassages(passages, q('cat'), scope());
    expect(hits.map((hit) => hit.key)).toEqual([3, 5, 2, 4]);
  });

  it('records where it matched', () => {
    const { hits } = searchPassages(passages, q('cat'), scope());
    expect(hits[0]).toMatchObject({ key: 3, name: [[0, 3]], tags: [[]], content: null });
    expect(hits[1]).toMatchObject({ key: 5, name: [], tags: [[[0, 3]]] });
  });

  it('gives the content details for a name match too', () => {
    const { hits } = searchPassages([passage(1, 'cat', 'a cat, a cat')], q('cat'), scope());
    expect(hits[0]).toMatchObject({ name: [[0, 3]], content: [2, 5] });
  });

  it('keeps the first match in the content', () => {
    const { hits } = searchPassages(passages, q('cat'), scope());
    expect(hits.find((hit) => hit.key === 2)).toMatchObject({ content: [4, 7] });
  });

  it('only searches what the scope allows', () => {
    const keys = (s: Partial<SearchScope>) =>
      searchPassages(passages, q('cat'), scope(s)).hits.map((hit) => hit.key);
    const none = { passageName: false, passageTags: false, passageContent: false };
    expect(keys({ ...none, passageName: true })).toEqual([3]);
    expect(keys({ ...none, passageTags: true })).toEqual([5]);
    expect(keys({ ...none, passageContent: true })).toEqual([2, 4]);
    expect(keys(none)).toEqual([]);
  });

  it('counts the tags of the passages found, once per passage', () => {
    const { tagCounts } = searchPassages(passages, q('cat'), scope());
    expect(Object.fromEntries(tagCounts)).toEqual({
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
