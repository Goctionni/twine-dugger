import { createEffect, deep, snapshot } from 'solid-js';

import type { ValueType } from '@/shared/shared-types';

import { setSetting, setStore, store } from '../../store/store';
import {
  createDefaultScope,
  createDefaultSort,
  type PassageSort,
  type SearchScope,
  type SearchSort,
  type StateSort,
} from '../core/types';
import type { SearchInput } from '../types';

/**
 * What the search is told, and what it is told to show of what it found. It lives in the store, so
 * it is still there after visiting another page. Which parts also survive a restart is up to the
 * settings. What only one part of the page cares about (which sections are open, which result is
 * selected) is not here but with that part.
 */
const params = () => store.viewState.search;

export const getScope = (): SearchScope => params().scope;
export const getSort = (): SearchSort => params().sort;
export const getTypeFilter = (): readonly ValueType[] => params().typeFilter;
export const getTagFilter = (): readonly string[] => params().tagFilter;

/** The store as the input of `createSearch` */
export const searchInput: SearchInput = {
  scope: getScope,
  sort: getSort,
  typeFilter: getTypeFilter,
  tagFilter: getTagFilter,
};

export function toggleStateScope(part: keyof SearchScope['state']) {
  setStore((draft) => {
    const state = draft.viewState.search.scope.state;
    state[part] = !state[part];
  });
}

export function togglePassageScope(part: keyof SearchScope['passage']) {
  setStore((draft) => {
    const { passage } = draft.viewState.search.scope;
    passage[part] = !passage[part];
  });
}

export function setStateSort(sort: StateSort) {
  setStore((draft) => {
    draft.viewState.search.sort.state = sort;
  });
}

export function setPassageSort(sort: PassageSort) {
  setStore((draft) => {
    draft.viewState.search.sort.passage = sort;
  });
}

const toggled = <T>(list: readonly T[], item: T) =>
  list.includes(item) ? list.filter((current) => current !== item) : [...list, item];

export function toggleType(type: ValueType) {
  setStore((draft) => {
    draft.viewState.search.typeFilter = toggled(draft.viewState.search.typeFilter, type);
  });
}
export function clearTypes() {
  setStore((draft) => {
    draft.viewState.search.typeFilter = [];
  });
}

export function toggleTag(tag: string) {
  setStore((draft) => {
    draft.viewState.search.tagFilter = toggled(draft.viewState.search.tagFilter, tag);
  });
}
export function clearTags() {
  setStore((draft) => {
    draft.viewState.search.tagFilter = [];
  });
}

/** Back to where nothing is filtered or sorted; the search text and its options are kept */
export function resetFilters() {
  setStore((draft) => {
    const search = draft.viewState.search;
    search.scope = createDefaultScope();
    search.sort = createDefaultSort();
    search.typeFilter = [];
    search.tagFilter = [];
  });
}

// How many things are not how they start out in each group of filters: for the badges
export const getScopeFilterCount = () => {
  const { state, passage } = getScope();
  return [...Object.values(state), ...Object.values(passage)].filter((isOn) => !isOn).length;
};
export const getSortFilterCount = () => {
  const sort = getSort();
  const defaultSort = createDefaultSort();
  return Number(sort.state !== defaultSort.state) + Number(sort.passage !== defaultSort.passage);
};
export const getTypeFilterCount = () => getTypeFilter().length;
export const getTagFilterCount = () => getTagFilter().length;

/** Whether anything is not how it starts out */
export const hasActiveFilters = () => {
  return Boolean(
    getScopeFilterCount() || getSortFilterCount() || getTypeFilterCount() || getTagFilterCount(),
  );
};

/**
 * Keeps the settings' copy of the parts the user asked to remember up to date. The search text and
 * the tag filter are never saved: what is worth filtering by depends on the game. (The options of
 * the search text are kept up to date by the search bar, which has them.)
 */
export function createSearchPersistence() {
  const remember = <K extends 'scope' | 'sort' | 'typeFilter'>(part: K, read: () => unknown) =>
    createEffect(
      () => (store.settings[`search.persist.${part}`] ? snapshot(deep(read())) : undefined),
      (value) => {
        if (value !== undefined) setSetting(`search.saved.${part}`, value as never);
      },
    );

  remember('scope', getScope);
  remember('sort', getSort);
  remember('typeFilter', getTypeFilter);
}
