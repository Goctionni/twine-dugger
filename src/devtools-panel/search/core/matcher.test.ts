import { describe, expect, it } from 'vite-plus/test';

import { createMatcher } from './matcher';
import { createDefaultOptions, type SearchOptions } from './types';

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
