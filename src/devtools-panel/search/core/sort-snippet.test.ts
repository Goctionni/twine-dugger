import { describe, expect, it } from 'vite-plus/test';

import { snippetAround } from './snippet';
import { sortPassageHits, sortStateHits } from './sort';
import type { PassageHit, StateHit } from './types';

const passageHit = (key: number): PassageHit => ({
  key,
  name: [],
  tags: [],
  content: null,
  contentCount: 0,
});
const stateHit = (pathText: string, type: StateHit['type'] = 'string'): StateHit => ({
  key: pathText,
  path: [pathText],
  pathText,
  type,
  value: undefined,
  pathMatch: [],
  valueMatch: [],
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
  const keys = (sorted: PassageHit[]) => sorted.map((hit) => hit.key);

  it('keeps the best-match order', () => {
    expect(keys(sortPassageHits(hits, 'match', (key) => names[key]!))).toEqual([1, 2, 3, 4, 5]);
  });

  it('sorts by name, ignoring case and reading numbers as numbers', () => {
    expect(keys(sortPassageHits(hits, 'name-asc', (key) => names[key]!))).toEqual([2, 1, 3, 5, 4]);
    expect(keys(sortPassageHits(hits, 'name-desc', (key) => names[key]!))).toEqual([4, 5, 3, 1, 2]);
  });

  it('sorts by the number of matches in name, tags and content, keeping the order for a tie', () => {
    const counted = [
      { ...passageHit(1), contentCount: 1 },
      { ...passageHit(2), contentCount: 5 },
      {
        ...passageHit(3),
        name: [[0, 1]] as PassageHit['name'],
        tags: [[[0, 1]], [[0, 1]]] as PassageHit['tags'],
      },
      { ...passageHit(4), contentCount: 1 },
    ];
    expect(keys(sortPassageHits(counted, 'most-matches', (key) => names[key]!))).toEqual([
      2, 3, 1, 4,
    ]);
  });

  it('leaves its input alone', () => {
    const copy = hits.slice();
    sortPassageHits(hits, 'name-desc', (key) => names[key]!);
    expect(hits).toEqual(copy);
  });
});

describe('sortStateHits', () => {
  const hits = [stateHit('b', 'number'), stateHit('a', 'string'), stateHit('c', 'object')];
  const paths = (sorted: StateHit[]) => sorted.map((hit) => hit.pathText);
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

describe('snippetAround', () => {
  const content = 'x'.repeat(100) + 'NEEDLE' + 'y'.repeat(200);

  it('cuts around the match and moves the range with it', () => {
    const { text, ranges } = snippetAround(content, [100, 106]);
    expect(text.startsWith('…') && text.endsWith('…')).toBe(true);
    expect(text.slice(...(ranges[0] as [number, number]))).toBe('NEEDLE');
  });

  it('does not add ellipses where nothing was cut', () => {
    const { text, ranges } = snippetAround('a cat', [2, 5]);
    expect(text).toBe('a cat');
    expect(ranges).toEqual([[2, 5]]);
  });

  it('makes one line, without moving the match', () => {
    const { text, ranges } = snippetAround('one\ntwo\r\n  cat', [11, 14]);
    expect(text).not.toMatch(/\n|\r/);
    expect(text.slice(...(ranges[0] as [number, number]))).toBe('cat');
  });
});
