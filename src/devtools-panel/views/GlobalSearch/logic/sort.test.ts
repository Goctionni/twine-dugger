import { describe, expect, it } from 'vite-plus/test';

import type { PassageMatcherHit, StateMatcherHit } from '../types';
import { rankNames, sortPassageHits, sortStateHits } from './sort';

const passageHit = (key: number): PassageMatcherHit => ({
  key,
  nameRanges: [],
  tagRanges: [],
  firstContentRange: null,
});
const stateHit = (pathText: string, type: StateMatcherHit['type'] = 'string'): StateMatcherHit => ({
  key: pathText,
  path: [pathText],
  pathText,
  type,
  value: undefined,
  pathRanges: [],
  valueRanges: [],
});

describe('sortPassageHits', () => {
  const names: Record<number, string> = {
    1: 'beta',
    2: 'Alpha',
    3: 'gamma',
    4: 'Room 10',
    5: 'Room 9',
  };
  const hits = [1, 2, 3, 4, 5].map(passageHit);
  const ranks = rankNames(Object.entries(names).map(([id, name]) => ({ id: Number(id), name })));
  const lookups = { getNameRank: (key: number) => ranks.get(key)!, getMatchCount: () => 0 };
  const keys = (sorted: PassageMatcherHit[]) => sorted.map((hit) => hit.key);

  it('keeps the best-match order', () => {
    expect(keys(sortPassageHits(hits, 'match', lookups))).toEqual([1, 2, 3, 4, 5]);
  });

  it('sorts by name, ignoring case and reading numbers as numbers', () => {
    expect(keys(sortPassageHits(hits, 'name-asc', lookups))).toEqual([2, 1, 3, 5, 4]);
    expect(keys(sortPassageHits(hits, 'name-desc', lookups))).toEqual([4, 5, 3, 1, 2]);
  });

  it('sorts by the number of matches, counted by the caller, keeping the order for a tie', () => {
    const counts: Record<number, number> = { 1: 1, 2: 7, 3: 3, 4: 1 };
    const counted = [1, 2, 3, 4].map(passageHit);
    const sorted = sortPassageHits(counted, 'most-matches', {
      ...lookups,
      getMatchCount: (hit) => counts[hit.key]!,
    });
    expect(keys(sorted)).toEqual([2, 3, 1, 4]);
  });

  it('leaves its input alone', () => {
    const copy = hits.slice();
    sortPassageHits(hits, 'name-desc', lookups);
    expect(hits).toEqual(copy);
  });
});

describe('sortStateHits', () => {
  const hits = [stateHit('b', 'number'), stateHit('a', 'string'), stateHit('c', 'object')];
  const paths = (sorted: StateMatcherHit[]) => sorted.map((hit) => hit.pathText);
  const never = () => 0;

  it('keeps the source order', () => {
    expect(paths(sortStateHits(hits, 'source', never))).toEqual(['b', 'a', 'c']);
  });

  it('sorts by path', () => {
    expect(paths(sortStateHits(hits, 'path-asc', never))).toEqual(['a', 'b', 'c']);
    expect(paths(sortStateHits(hits, 'path-desc', never))).toEqual(['c', 'b', 'a']);
  });

  it('sorts by type, then path', () => {
    expect(paths(sortStateHits(hits, 'type', never))).toEqual(['c', 'a', 'b']);
  });

  it('puts the most recently changed first', () => {
    const changed: Record<string, number> = { a: 5, b: 9 };
    expect(paths(sortStateHits(hits, 'recent', (key) => changed[key] ?? 0))).toEqual([
      'b',
      'a',
      'c',
    ]);
  });
});
