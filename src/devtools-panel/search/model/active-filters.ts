import type { SearchScope } from '../core/types';
import {
  getScope,
  getSort,
  getTagFilter,
  getTypeFilter,
  setSort,
  toggleScope,
  toggleTag,
  toggleType,
} from './search-state';

export interface ActiveFilter {
  /** Unique among the active filters */
  id: string;
  label: string;
  remove: () => void;
}

export const scopeLabels: Record<keyof SearchScope, string> = {
  statePath: 'Path',
  stateValue: 'Value',
  passageName: 'Name',
  passageTags: 'Tags',
  passageContent: 'Content',
};

/** Everything that is not how it starts out, so that it can be seen and taken away one by one */
export function getActiveFilters(): ActiveFilter[] {
  const filters: ActiveFilter[] = [];
  const scope = getScope();
  for (const key of Object.keys(scopeLabels) as Array<keyof SearchScope>) {
    if (!scope[key]) {
      filters.push({
        id: `scope:${key}`,
        label: `Not in ${scopeLabels[key].toLowerCase()}`,
        remove: () => toggleScope(key),
      });
    }
  }
  const sort = getSort();
  if (sort.state !== 'source') {
    filters.push({
      id: 'sort:state',
      label: 'State sorted',
      remove: () => setSort('state', 'source'),
    });
  }
  if (sort.passage !== 'match') {
    filters.push({
      id: 'sort:passage',
      label: 'Passages sorted',
      remove: () => setSort('passage', 'match'),
    });
  }
  for (const type of getTypeFilter()) {
    filters.push({ id: `type:${type}`, label: type, remove: () => toggleType(type) });
  }
  for (const tag of getTagFilter()) {
    filters.push({ id: `tag:${tag}`, label: `#${tag}`, remove: () => toggleTag(tag) });
  }
  return filters;
}

/** How many of the four filter groups have something set: for badges */
export function getFilterCounts() {
  const scope = getScope();
  const sort = getSort();
  return {
    scope: Object.values(scope).filter((on) => !on).length,
    sort: Number(sort.state !== 'source') + Number(sort.passage !== 'match'),
    types: getTypeFilter().length,
    tags: getTagFilter().length,
  };
}
