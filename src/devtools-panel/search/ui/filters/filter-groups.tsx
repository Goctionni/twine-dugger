import type { JSX } from '@solidjs/web';

import {
  getScopeFilterCount,
  getSortFilterCount,
  getTagFilterCount,
  getTypeFilterCount,
} from '../../model/search-state';
import { ScopeFilter } from './filter-groups/ScopeFilter';
import { SortFilter } from './filter-groups/SortFilter';
import { TagFilter } from './filter-groups/TagFilter';
import { TypeFilter } from './filter-groups/TypeFilter';

export interface FilterGroup {
  title: string;
  /** A short mark for where there is no room for the title */
  icon: string;
  Body: () => JSX.Element;
  /** How many things are set in the group: for badges */
  count: () => number;
}

/** The four groups. How they are laid out (full sidebar, icons, top bar) is up to the one that shows them */
export const filterGroups: FilterGroup[] = [
  { title: 'Search in', icon: '⌕', Body: ScopeFilter, count: getScopeFilterCount },
  { title: 'Sort', icon: '⇅', Body: SortFilter, count: getSortFilterCount },
  { title: 'State types', icon: '{}', Body: TypeFilter, count: getTypeFilterCount },
  { title: 'Passage tags', icon: '#', Body: TagFilter, count: getTagFilterCount },
];
