import { describe, expect, it } from 'vite-plus/test';

import { createDefaultOptions, type SearchOptions } from '../../core/types';
import { createMatcher } from './matcher';

const matcherFor = (searchText: string, options: Partial<SearchOptions> = {}) => {
  const result = createMatcher({ searchText, options: { ...createDefaultOptions(), ...options } });
  if (!result.ok) throw new Error('expected a valid search');
  return result.matcher;
};

describe('createMatcher', () => {
  it('matches literally: special characters are not regex syntax', () => {
    expect(matcherFor('a.c').ranges('abc a.c')).toEqual([[4, 7]]);
    expect(matcherFor('(x)').test('f(x)')).toBe(true);
  });

  it('ignores case unless asked not to', () => {
    expect(matcherFor('the').ranges('The THE the')).toEqual([
      [0, 3],
      [4, 7],
      [8, 11],
    ]);
    expect(matcherFor('the', { caseSensitive: true }).ranges('The THE the')).toEqual([[8, 11]]);
  });

  it('only finds whole words when asked', () => {
    const matcher = matcherFor('cat', { wholeWord: true });
    expect(matcher.ranges('cat concat cat. cats')).toEqual([
      [0, 3],
      [11, 14],
    ]);
    expect(matcher.test('concat')).toBe(false);
  });

  it('treats the search text as a regex when asked', () => {
    expect(matcherFor('a+b', { regex: true }).ranges('aab ab b')).toEqual([
      [0, 3],
      [4, 6],
    ]);
    expect(matcherFor('^x', { regex: true }).test('yx')).toBe(false);
  });

  it('combines whole word with regex', () => {
    expect(matcherFor('c.t', { regex: true, wholeWord: true }).ranges('cat concat')).toEqual([
      [0, 3],
    ]);
  });

  it('reports an invalid regex instead of throwing', () => {
    const result = createMatcher({
      searchText: '(',
      options: { ...createDefaultOptions(), regex: true },
    });
    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? '' : result.error).toBeTruthy();
  });

  it('does not report empty matches (a*)', () => {
    const matcher = matcherFor('a*', { regex: true });
    expect(matcher.ranges('bab')).toEqual([[1, 2]]);
    expect(matcher.test('bbb')).toBe(false);
    expect(matcher.first('bbb')).toBeNull();
    expect(matcher.count('baab')).toBe(1);
  });

  it('gives the first match, the count, and caps the ranges', () => {
    const matcher = matcherFor('a');
    expect(matcher.first('xxa a')).toEqual([2, 3]);
    expect(matcher.first('xx')).toBeNull();
    expect(matcher.count('a'.repeat(120))).toBe(120);
    expect(matcher.ranges('a'.repeat(120))).toHaveLength(50);
    expect(matcher.ranges('a'.repeat(120), 3)).toHaveLength(3);
  });

  it('can be used on many texts: no state is left between calls', () => {
    const matcher = matcherFor('a');
    expect(matcher.ranges('a')).toEqual(matcher.ranges('a'));
    expect(matcher.first('a')).toEqual(matcher.first('a'));
  });
});

describe('canNarrowFrom', () => {
  const narrow = (a: [string, Partial<SearchOptions>?], b: [string, Partial<SearchOptions>?]) =>
    matcherFor(b[0], b[1]).canNarrowFrom(matcherFor(a[0], a[1]));

  it('is true when the new text contains the old one', () => {
    expect(narrow(['a'], ['aa'])).toBe(true);
    expect(narrow(['ab'], ['xabx'])).toBe(true);
    expect(narrow(['a'], ['a'])).toBe(true);
  });

  it('is false when it does not', () => {
    expect(narrow(['aa'], ['a'])).toBe(false);
    expect(narrow(['ab'], ['ba'])).toBe(false);
  });

  it('ignores case only for a case-insensitive search', () => {
    expect(narrow(['A'], ['ba'])).toBe(true);
    expect(narrow(['A', { caseSensitive: true }], ['ba', { caseSensitive: true }])).toBe(false);
  });

  it('is true when case sensitivity is switched on: what matches with the case matches without it', () => {
    expect(narrow(['a'], ['aa', { caseSensitive: true }])).toBe(true);
    expect(narrow(['ab'], ['xAB', { caseSensitive: true }])).toBe(true);
    expect(narrow(['ab'], ['xyz', { caseSensitive: true }])).toBe(false);
  });

  it('is false when case sensitivity is switched off: the new search finds more', () => {
    expect(narrow(['a', { caseSensitive: true }], ['aa'])).toBe(false);
    expect(narrow(['ab', { caseSensitive: true }], ['xab'])).toBe(false);
  });

  it('is false for whole word and regex, which are not subsets', () => {
    expect(narrow(['a', { wholeWord: true }], ['aa', { wholeWord: true }])).toBe(false);
    expect(narrow(['a'], ['aa', { wholeWord: true }])).toBe(false);
    expect(narrow(['a', { regex: true }], ['aa', { regex: true }])).toBe(false);
    expect(narrow(['a'], ['aa', { regex: true }])).toBe(false);
  });
});
