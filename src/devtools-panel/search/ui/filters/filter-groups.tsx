import type { JSX } from '@solidjs/web';

import { getFilterCounts } from '../../model/active-filters';
import { ScopeFilter } from './ScopeFilter';
import { SortFilter } from './SortFilter';
import { TagFilter } from './TagFilter';
import { TypeFilter } from './TypeFilter';

export interface FilterGroup {
  id: 'scope' | 'sort' | 'types' | 'tags';
  title: string;
  /** A short mark for where there is no room for the title */
  icon: string;
  /** How many things are set in the group */
  count: () => number;
  Body: () => JSX.Element;
}

/** The four groups. How they are laid out (rail, strip, bar) is up to the one that shows them */
export const filterGroups: FilterGroup[] = [
  {
    id: 'scope',
    title: 'Search in',
    icon: '⌕',
    count: () => getFilterCounts().scope,
    Body: ScopeFilter,
  },
  { id: 'sort', title: 'Sort', icon: '⇅', count: () => getFilterCounts().sort, Body: SortFilter },
  {
    id: 'types',
    title: 'State types',
    icon: '{}',
    count: () => getFilterCounts().types,
    Body: TypeFilter,
  },
  {
    id: 'tags',
    title: 'Passage tags',
    icon: '#',
    count: () => getFilterCounts().tags,
    Body: TagFilter,
  },
];
