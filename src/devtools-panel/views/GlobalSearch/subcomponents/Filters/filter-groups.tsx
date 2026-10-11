import type { JSX } from '@solidjs/web';

import type { ValueType } from '@/shared/shared-types';

import {
  getScopeFilterCount,
  getSortFilterCount,
  getTagFilterCount,
  getTypeFilterCount,
} from '../../store-helpers/search-state';
import { ScopeFilter } from './ScopeFilter';
import { SortFilter } from './SortFilter';
import { TagFilter } from './TagFilter';
import { TypeFilter } from './TypeFilter';

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
  tagCounts: Map<string, number>;
  typeCounts: Partial<Record<ValueType, number>>;
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
