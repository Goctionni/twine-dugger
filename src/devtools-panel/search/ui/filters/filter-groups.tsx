import type { JSX } from '@solidjs/web';
import type { Accessor } from 'solid-js';

import type { ValueType } from '@/shared/shared-types';

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

export interface FilterCounts {
  /** How many of what was found have each tag, and each type */
  tagCounts: Accessor<Map<string, number>>;
  typeCounts: Accessor<Partial<Record<ValueType, number>>>;
}

/** The four groups. How they are laid out (full sidebar, icons, top bar) is up to the one that shows them */
export const createFilterGroups = (counts: FilterCounts): FilterGroup[] => [
  { title: 'Search in', icon: '⌕', Body: ScopeFilter, count: getScopeFilterCount },
  { title: 'Sort', icon: '⇅', Body: SortFilter, count: getSortFilterCount },
  {
    title: 'State types',
    icon: '{}',
    Body: () => <TypeFilter typeCounts={counts.typeCounts} />,
    count: getTypeFilterCount,
  },
  {
    title: 'Passage tags',
    icon: '#',
    Body: () => <TagFilter tagCounts={counts.tagCounts} />,
    count: getTagFilterCount,
  },
];
