import type { JSX } from '@solidjs/web';
import type { Accessor } from 'solid-js';

import type { JSONSafeObject, ParsedPassageData } from '@/shared/shared-types';

import type { NarrowStyle } from './core/types';
import type { createSearch } from './model/create-search';

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

export type SearchModel = ReturnType<typeof createSearch>;

export type Section = 'state' | 'passage';

export interface SelectedHit {
  section: Section;
  key: string | number;
}

export interface ActiveFilter {
  /** Unique among the active filters */
  id: string;
  label: string;
  remove: () => void;
}

export type FilterMode = 'rail' | NarrowStyle;

export type DetailMode = 'column' | 'sheet';

export interface FilterGroup {
  id: 'scope' | 'sort' | 'types' | 'tags';
  title: string;
  /** A short mark for where there is no room for the title */
  icon: string;
  /** How many things are set in the group */
  count: () => number;
  Body: () => JSX.Element;
}
