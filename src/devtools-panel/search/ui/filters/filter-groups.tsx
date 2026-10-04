import { getFilterCounts } from '../../model/active-filters';
import type { FilterGroup } from '../../types';
import { ScopeFilter } from './ScopeFilter';
import { SortFilter } from './SortFilter';
import { TagFilter } from './TagFilter';
import { TypeFilter } from './TypeFilter';

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
