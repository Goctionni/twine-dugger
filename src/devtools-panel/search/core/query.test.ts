import { describe, expect, it } from 'vite-plus/test';

import { canNarrow, queryKey } from './query';
import { createDefaultOptions, type SearchOptions, type SearchQuery } from './types';

const query = (searchText: string, options: Partial<SearchOptions> = {}): SearchQuery => ({
  searchText,
  options: { ...createDefaultOptions(), ...options },
});

describe('queryKey', () => {
  it('differs by text and by every option', () => {
    const keys = new Set([
      queryKey(query('a')),
      queryKey(query('b')),
      queryKey(query('a', { caseSensitive: true })),
      queryKey(query('a', { wholeWord: true })),
      queryKey(query('a', { regex: true })),
    ]);
    expect(keys.size).toBe(5);
    expect(queryKey(query('a'))).toBe(queryKey(query('a')));
  });
});

describe('canNarrow', () => {
  const narrow = (a: [string, Partial<SearchOptions>?], b: [string, Partial<SearchOptions>?]) =>
    canNarrow(query(a[0], a[1]), query(b[0], b[1]));

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
