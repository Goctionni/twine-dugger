import type { JSX } from '@solidjs/web';
import { Show } from 'solid-js';

import type { ValueType } from '@/shared/shared-types';

import {
  clearTags,
  clearTypes,
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
  /** Undo what is set in the group, if it can be undone */
  clear?: () => void;
}

/** Title, badge, and clear action; fixed height so the body never shifts. */
export function GroupHeading(props: { group: FilterGroup; compact?: boolean }) {
  return (
    <h3
      class={[
        'mb-1 flex items-center justify-between text-xs font-semibold tracking-wide text-slate-300 uppercase',
        { 'px-1': !props.compact },
      ]}
    >
      <span>
        {props.group.title}
        <Show when={props.group.count()}>
          <span class="ml-1 rounded-full bg-sky-600 px-1.5 text-white">{props.group.count()}</span>
        </Show>
      </span>
      <Show when={props.group.clear && props.group.count()}>
        <button
          type="button"
          class="cursor-pointer font-normal text-sky-400 normal-case hover:underline"
          onClick={() => props.group.clear!()}
        >
          Clear
        </button>
      </Show>
    </h3>
  );
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
    clear: clearTypes,
  },
  {
    title: 'Passage tags',
    icon: '#',
    Body: () => <TagFilter tagCounts={counts.tagCounts} />,
    count: getTagFilterCount,
    clear: clearTags,
  },
];
