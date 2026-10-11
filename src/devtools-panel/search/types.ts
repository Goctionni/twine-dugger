import type { Accessor } from 'solid-js';

import type { JSONSafeObject, ParsedPassageData, ValueType } from '@/shared/shared-types';

import type { PassageHit, Range, StateHit } from './core/types';

/** Note that these are not tailwind breakpoints */
export type Breakpoint = 'sm' | 'md' | 'lg';
export type FilterLayout = 'full-sidebar' | 'icon-sidebar' | 'top-bar';
export type DetailMode = 'column' | 'sheet';

/** Where the search reads from; `gameData` is the game that is being inspected */
export interface SearchData {
  passages: Accessor<readonly ParsedPassageData[]>;
  /** Changes whenever the state does, so the state is searched again */
  stateVersion: Accessor<number>;
  /** The state as plain data. Reading it is not tracked; `stateVersion` says when to look again */
  getState: () => JSONSafeObject;
  /** Higher = changed more recently */
  getLastChange: (key: string) => number;
}

/** What the search found, and what the parts that show it need to know about it */
export interface SearchModel {
  /** Whether there is something to search for */
  hasQuery: () => boolean;
  /** What was found and is shown: the same object for a hit that stays, so this is what rows read */
  passageHits: readonly PassageHit[];
  stateHits: readonly StateHit[];
  /** The same hits, as a plain array that is new whenever they change: this tells the keys apart */
  sortedPassageHits: Accessor<readonly PassageHit[]>;
  sortedStateHits: Accessor<readonly StateHit[]>;
  /** Found, before the filters. The hits have what is left of it */
  passageTotal: Accessor<number>;
  stateTotal: Accessor<number>;
  /** How many of what was found have each tag, and each type: for the filters */
  tagCounts: Accessor<Map<string, number>>;
  typeCounts: Accessor<Partial<Record<ValueType, number>>>;
  /** Looks up a passage by id: for the parts that show more than the hit has */
  getPassage: (id: number) => ParsedPassageData | undefined;
  /** Where the search text is found in `text`, and how often: for marking it and for counting */
  findRanges: (text: string, max?: number) => Range[];
  countMatches: (text: string) => number;
}
