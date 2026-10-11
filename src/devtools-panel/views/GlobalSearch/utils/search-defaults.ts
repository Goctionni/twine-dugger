import type { SearchOptions, SearchScope, SearchSort } from '../types';

// Functions, not constants: the store changes what it is given, and the defaults must stay as they are
export const createDefaultOptions = (): SearchOptions => ({
  caseSensitive: false,
  wholeWord: false,
  regex: false,
});

export const createDefaultScope = (): SearchScope => ({
  state: { path: true, value: true },
  passage: { name: true, tags: true, content: true },
});

export const createDefaultSort = (): SearchSort => ({ state: 'source', passage: 'match' });
