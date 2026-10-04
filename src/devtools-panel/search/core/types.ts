import type { ParsedPassageData, Path, ValueType } from '@/shared/shared-types';

/** Half-open character range `[start, end)` into the searched text */
export type Range = readonly [start: number, end: number];

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

export interface SearchScope {
  statePath: boolean;
  stateValue: boolean;
  passageName: boolean;
  passageTags: boolean;
  passageContent: boolean;
}

/** The parts of the scope that decide what is searched in passages / in the state */
export type PassageScope = Pick<SearchScope, 'passageName' | 'passageTags' | 'passageContent'>;
export type StateScope = Pick<SearchScope, 'statePath' | 'stateValue'>;

export type PassageSort = 'match' | 'most-matches' | 'name-asc' | 'name-desc';
export type StateSort = 'source' | 'path-asc' | 'path-desc' | 'type' | 'recent';
export interface SearchSort {
  state: StateSort;
  passage: PassageSort;
}

export type SearchView = 'both' | 'state' | 'passage';
export type NarrowStyle = 'strip' | 'bar';

export const defaultSearchOptions: SearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regex: false,
};

export const defaultSearchScope: SearchScope = {
  statePath: true,
  stateValue: true,
  passageName: true,
  passageTags: true,
  passageContent: true,
};

export const defaultSearchSort: SearchSort = { state: 'source', passage: 'match' };

/** Plain data: no reference to the passage, so a hit is cheap to keep and to compare by key */
export interface PassageHit {
  /** Passage id */
  key: number;
  /** Matches in the name; empty = none */
  name: Range[];
  /** Per tag (same index as `passage.tags`); an empty array = no match in that tag */
  tags: Range[][];
  /** First match in the content (snippet anchor); null = none. The detail pane recomputes all */
  content: Range | null;
  /** Total number of matches in the content, including those beyond the stored range */
  contentCount: number;
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
  pathMatch: Range[];
  valueMatch: Range[];
}

export interface CompiledQuery {
  readonly ok: true;
  readonly text: string;
  readonly options: SearchOptions;
  /** Identifies text + options; equal keys always give equal results */
  readonly key: string;
  /** Whether `text` has at least one (non-empty) match */
  test(text: string): boolean;
  /** The first match */
  first(text: string): Range | null;
  /** Up to `max` matches */
  ranges(text: string, max?: number): Range[];
  /** The number of matches */
  count(text: string): number;
}

export interface InvalidQuery {
  readonly ok: false;
  readonly error: string;
}

export interface PassageSearchResult {
  /** Best match first: matches in the name or tags, then the ones that only match in the content */
  hits: PassageHit[];
  /** The passages the hits are about, in the order they were given. This is what a narrower search starts from */
  passages: ParsedPassageData[];
  /** How many hits have each tag */
  tagCounts: Map<string, number>;
}

export interface StateSearchResult {
  /** In the order the values are in the state */
  hits: StateHit[];
  /** How many hits there are of each type */
  typeCounts: Partial<Record<ValueType, number>>;
}

export interface Snippet {
  text: string;
  ranges: Range[];
}
