import { createEffect, createSignal, deep, snapshot } from 'solid-js';

import type { ValueType } from '@/shared/shared-types';

import { setSetting, setStore, store } from '../../store/store';
import {
  defaultSearchScope,
  defaultSearchSort,
  type PassageSort,
  type SearchOptions,
  type SearchScope,
  type SearchView,
  type StateSort,
} from '../core/types';

/**
 * What the search page remembers while DevTools is open. It lives in the store, so it is still
 * there after visiting another page. Which parts also survive a restart is up to the settings.
 */
const session = () => store.viewState.search;

export const getQuery = () => session().query;
export const getOptions = (): SearchOptions => session().options;
export const getScope = (): SearchScope => session().scope;
export const getSort = () => session().sort;
export const getTypeFilter = () => session().typeFilter;
export const getTagFilter = () => session().tagFilter;
export const getView = () => session().view;
export const getCollapsed = () => session().collapsed;

export function setQuery(query: string) {
  setStore((draft) => {
    draft.viewState.search.query = query;
  });
}

let isQueryScheduled = false;

/** The longest a search waits for idle time: the user is waiting for the results */
const SEARCH_IDLE_TIMEOUT_MS = 50;

/** Searches for what `read` returns when the browser is idle, not inside the key press that caused it. */
export function setQueryWhenIdle(read: () => string) {
  if (isQueryScheduled) return;
  isQueryScheduled = true;
  requestIdleCallback(
    () => {
      isQueryScheduled = false;
      setQuery(read());
    },
    { timeout: SEARCH_IDLE_TIMEOUT_MS },
  );
}

export function toggleOption(option: keyof SearchOptions) {
  setStore((draft) => {
    draft.viewState.search.options[option] = !draft.viewState.search.options[option];
  });
}

export function toggleScope(scope: keyof SearchScope) {
  setStore((draft) => {
    draft.viewState.search.scope[scope] = !draft.viewState.search.scope[scope];
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

export function setView(view: SearchView) {
  setStore((draft) => {
    draft.viewState.search.view = view;
  });
}

export function toggleCollapsed(section: 'state' | 'passage') {
  setStore((draft) => {
    draft.viewState.search.collapsed[section] = !draft.viewState.search.collapsed[section];
  });
}

/** Back to what nothing has been filtered or sorted; the query and its options are kept */
export function resetFilters() {
  setStore((draft) => {
    const search = draft.viewState.search;
    search.scope = { ...defaultSearchScope };
    search.sort = { ...defaultSearchSort };
    search.typeFilter = [];
    search.tagFilter = [];
  });
}

/**
 * Keeps the settings' copy of the slices the user asked to remember up to date. The query and the
 * tag filter are never saved: what is worth filtering by depends on the game.
 */
export function createSearchPersistence() {
  const remember = <K extends 'options' | 'scope' | 'sort' | 'typeFilter'>(
    slice: K,
    read: () => (typeof store.viewState.search)[K],
  ) =>
    createEffect(
      () => (store.settings[`search.persist.${slice}`] ? snapshot(deep(read())) : undefined),
      (value) => {
        if (value !== undefined) setSetting(`search.saved.${slice}`, value as never);
      },
    );

  remember('options', () => session().options);
  remember('scope', () => session().scope);
  remember('sort', () => session().sort);
  remember('typeFilter', () => session().typeFilter);
}

export const [getFocusRequests, setFocusRequests] = createSignal(0);

/** Asks the query input to take the focus: when it is on the page now, or as soon as it is */
export const requestQueryFocus = () => setFocusRequests((count) => count + 1);
