import type { Accessor } from 'solid-js';

import type { JSONSafeObject, ParsedPassageData, ValueType } from '@/shared/shared-types';

import type { SearchScope, SearchSort } from './core/types';
import type { createSearch } from './model/create-search';

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

/**
 * What the search is told besides what to search for (the matcher). The scope decides what is
 * found: when it changes, it is searched again. The rest works on what was found: it only changes
 * which of it is shown, and in what order.
 */
export interface SearchInput {
  scope: Accessor<SearchScope>;
  /** Value types to show in the state results; empty = all */
  typeFilter: Accessor<readonly ValueType[]>;
  /** Passage tags to require; empty = all */
  tagFilter: Accessor<readonly string[]>;
  sort: Accessor<SearchSort>;
}

export type SearchModel = ReturnType<typeof createSearch>;
