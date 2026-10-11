import type { ParsedPassageData, Path, ValueType } from '@/shared/shared-types';

/** Half-open character range `[start, end)` into the searched text */
export type Range = readonly [start: number, end: number];

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

/** What is searched for: the text and how to read it */
export interface SearchQuery {
  searchText: string;
  options: SearchOptions;
}

/** What is searched in. A part that is switched off finds nothing */
export interface StateScope {
  path: boolean;
  value: boolean;
}
export interface PassageScope {
  name: boolean;
  tags: boolean;
  content: boolean;
}
export interface SearchScope {
  state: StateScope;
  passage: PassageScope;
}

export type PassageSort = 'match' | 'most-matches' | 'name-asc' | 'name-desc';
export type StateSort = 'source' | 'path-asc' | 'path-desc' | 'type' | 'recent';
export interface SearchSort {
  state: StateSort;
  passage: PassageSort;
}

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

/** Plain data: no reference to the passage, so a hit is cheap to keep and to compare by key */
export interface PassageHit {
  /** Passage id */
  key: number;
  /** Matches in the name; empty = none */
  nameRanges: Range[];
  /** Per tag (same index as `passage.tags`); an empty array = no match in that tag */
  tagRanges: Range[][];
  /** The first match in the content (where a snippet starts); null = none. The others are left to who needs them */
  firstContentRange: Range | null;
}

export interface StateHit {
  /** `pathKey(path)` */
  key: string;
  path: Path;
  /** Display form of the path, e.g. `schedule.get("monday")` */
  pathText: string;
  type: ValueType;
  /** Value at search time; containers have none */
  value: string | number | boolean | null | undefined;
  /** Matches in `pathText` */
  pathRanges: Range[];
  /** Matches in the value written as text */
  valueRanges: Range[];
}

/** Finds the matches of a search text in a text. Made by `createMatcher` */
export interface Matcher {
  /** What this matcher was made from */
  readonly query: SearchQuery;
  /** Whether the new search needs to search in all state/passages, or only previous results  */
  canNarrowFrom(previous: Matcher): boolean;
  /** Whether `text` has at least one (non-empty) match */
  test(text: string): boolean;
  /** The first match */
  first(text: string): Range | null;
  /** Up to `max` matches */
  ranges(text: string, max?: number): Range[];
  /** The number of matches */
  count(text: string): number;
}

export interface PassageSearchResult {
  /** Best match first: matches in the name or tags, then the ones that only match in the content */
  hits: PassageHit[];
  /** The passages the hits are about, in the order they were given. This is what a narrower search starts from */
  passages: ParsedPassageData[];
}

export interface Snippet {
  text: string;
  ranges: Range[];
}
