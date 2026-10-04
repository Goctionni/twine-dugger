import { describe, expect, it } from 'vite-plus/test';

import { canNarrow, compileQuery, queryKey, type CompiledQuery } from './query';
import { defaultSearchOptions, type SearchOptions } from './types';

const compile = (text: string, options: Partial<SearchOptions> = {}) => {
  const query = compileQuery(text, { ...defaultSearchOptions, ...options });
  if (!query?.ok) throw new Error('expected a valid query');
  return query as CompiledQuery;
};

describe('compileQuery', () => {
  it('is null for an empty query', () => {
    expect(compileQuery('', defaultSearchOptions)).toBeNull();
  });

  it('matches literally: special characters are not regex syntax', () => {
    expect(compile('a.c').ranges('abc a.c')).toEqual([[4, 7]]);
    expect(compile('(x)').test('f(x)')).toBe(true);
  });

  it('ignores case unless asked not to', () => {
    expect(compile('the').ranges('The THE the')).toEqual([
      [0, 3],
      [4, 7],
      [8, 11],
    ]);
    expect(compile('the', { caseSensitive: true }).ranges('The THE the')).toEqual([[8, 11]]);
  });

  it('only finds whole words when asked', () => {
    const query = compile('cat', { wholeWord: true });
    expect(query.ranges('cat concat cat. cats')).toEqual([
      [0, 3],
      [11, 14],
    ]);
    expect(query.test('concat')).toBe(false);
  });

  it('treats the query as a regex when asked', () => {
    expect(compile('a+b', { regex: true }).ranges('aab ab b')).toEqual([
      [0, 3],
      [4, 6],
    ]);
    expect(compile('^x', { regex: true }).test('yx')).toBe(false);
  });

  it('combines whole word with regex', () => {
    expect(compile('c.t', { regex: true, wholeWord: true }).ranges('cat concat')).toEqual([[0, 3]]);
  });

  it('reports an invalid regex instead of throwing', () => {
    const query = compileQuery('(', { ...defaultSearchOptions, regex: true });
    expect(query).toMatchObject({ ok: false });
    expect((query as { error: string }).error).toBeTruthy();
  });

  it('does not report empty matches (a*)', () => {
    const query = compile('a*', { regex: true });
    expect(query.ranges('bab')).toEqual([[1, 2]]);
    expect(query.test('bbb')).toBe(false);
    expect(query.first('bbb')).toBeNull();
    expect(query.count('baab')).toBe(1);
  });

  it('gives the first match, the count, and caps the ranges', () => {
    const query = compile('a');
    expect(query.first('xxa a')).toEqual([2, 3]);
    expect(query.first('xx')).toBeNull();
    expect(query.count('a'.repeat(120))).toBe(120);
    expect(query.ranges('a'.repeat(120))).toHaveLength(50);
    expect(query.ranges('a'.repeat(120), 3)).toHaveLength(3);
  });

  it('can be used on many texts: no state is left between calls', () => {
    const query = compile('a');
    expect(query.ranges('a')).toEqual(query.ranges('a'));
    expect(query.first('a')).toEqual(query.first('a'));
  });
});

describe('queryKey', () => {
  it('differs by text and by every option', () => {
    const keys = new Set([
      queryKey('a', defaultSearchOptions),
      queryKey('b', defaultSearchOptions),
      queryKey('a', { ...defaultSearchOptions, caseSensitive: true }),
      queryKey('a', { ...defaultSearchOptions, wholeWord: true }),
      queryKey('a', { ...defaultSearchOptions, regex: true }),
    ]);
    expect(keys.size).toBe(5);
    expect(queryKey('a', defaultSearchOptions)).toBe(queryKey('a', { ...defaultSearchOptions }));
  });
});

describe('canNarrow', () => {
  const narrow = (a: [string, Partial<SearchOptions>?], b: [string, Partial<SearchOptions>?]) =>
    canNarrow(compile(a[0], a[1]), compile(b[0], b[1]));

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

  it('is false when the case option changes', () => {
    expect(narrow(['a'], ['aa', { caseSensitive: true }])).toBe(false);
    expect(narrow(['a', { caseSensitive: true }], ['aa'])).toBe(false);
  });

  it('is false for whole word and regex, which are not subsets', () => {
    expect(narrow(['a', { wholeWord: true }], ['aa', { wholeWord: true }])).toBe(false);
    expect(narrow(['a'], ['aa', { wholeWord: true }])).toBe(false);
    expect(narrow(['a', { regex: true }], ['aa', { regex: true }])).toBe(false);
    expect(narrow(['a'], ['aa', { regex: true }])).toBe(false);
  });
});
