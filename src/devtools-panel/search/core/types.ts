import type { Path, ValueType } from '@/shared/shared-types';

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
