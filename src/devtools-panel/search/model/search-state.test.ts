import { createRoot, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { setSetting, setStore, store } from '../../store/store';
import { createDefaultOptions, createDefaultScope, createDefaultSort } from '../core/types';
import {
  createSearchPersistence,
  getScopeFilterCount,
  getSortFilterCount,
  getTagFilterCount,
  getTypeFilterCount,
  hasActiveFilters,
  resetFilters,
  setPassageSort,
  setSearchText,
  setStateSort,
  toggleOption,
  togglePassageScope,
  toggleStateScope,
  toggleTag,
  toggleType,
} from './search-state';

let dispose: () => void;
beforeEach(() => {
  setStore((draft) => {
    draft.viewState.search.query = { searchText: '', options: createDefaultOptions() };
    draft.viewState.search.scope = createDefaultScope();
    draft.viewState.search.sort = createDefaultSort();
    draft.viewState.search.typeFilter = [];
    draft.viewState.search.tagFilter = [];
    draft.settings['search.persist.options'] = false;
    draft.settings['search.persist.scope'] = false;
    draft.settings['search.persist.sort'] = false;
    draft.settings['search.persist.typeFilter'] = false;
    draft.settings['search.saved.options'] = createDefaultOptions();
    draft.settings['search.saved.scope'] = createDefaultScope();
    draft.settings['search.saved.sort'] = createDefaultSort();
    draft.settings['search.saved.typeFilter'] = [];
  });
  flush();
  createRoot((d) => {
    dispose = d;
    createSearchPersistence();
  });
});
afterEach(() => dispose());

describe('what the search is told', () => {
  it('toggles options, scopes, types and tags', () => {
    toggleOption('regex');
    toggleStateScope('path');
    togglePassageScope('content');
    toggleType('number');
    toggleTag('room');
    flush();
    const search = store.viewState.search;
    expect(search.query.options.regex).toBe(true);
    expect(search.scope.state.path).toBe(false);
    expect(search.scope.passage.content).toBe(false);
    expect(search.typeFilter).toEqual(['number']);
    expect(search.tagFilter).toEqual(['room']);

    toggleType('number');
    toggleTag('room');
    flush();
    expect(store.viewState.search.typeFilter).toEqual([]);
    expect(store.viewState.search.tagFilter).toEqual([]);
  });

  it('resets scope, sort and filters but keeps the search text and its options', () => {
    setSearchText('abc');
    toggleOption('wholeWord');
    toggleStateScope('path');
    setPassageSort('name-asc');
    toggleType('string');
    toggleTag('room');
    flush();
    resetFilters();
    flush();
    const search = store.viewState.search;
    expect(search.query.searchText).toBe('abc');
    expect(search.query.options.wholeWord).toBe(true);
    expect(search.scope).toEqual(createDefaultScope());
    expect(search.sort).toEqual(createDefaultSort());
    expect(search.typeFilter).toEqual([]);
    expect(search.tagFilter).toEqual([]);
  });

  it('does not change the defaults it started from', () => {
    toggleOption('regex');
    toggleStateScope('value');
    flush();
    expect(createDefaultOptions().regex).toBe(false);
    expect(createDefaultScope().state.value).toBe(true);
  });
});

describe('active filters', () => {
  it('has none to start with', () => {
    expect(hasActiveFilters()).toBe(false);
    expect([
      getScopeFilterCount(),
      getSortFilterCount(),
      getTypeFilterCount(),
      getTagFilterCount(),
    ]).toEqual([0, 0, 0, 0]);
  });

  it('counts what is not how it starts out, per group', () => {
    toggleStateScope('path');
    togglePassageScope('content');
    togglePassageScope('tags');
    setStateSort('type');
    setPassageSort('name-asc');
    toggleType('string');
    toggleTag('room');
    toggleTag('indoor');
    flush();
    expect([
      getScopeFilterCount(),
      getSortFilterCount(),
      getTypeFilterCount(),
      getTagFilterCount(),
    ]).toEqual([3, 2, 1, 2]);
    expect(hasActiveFilters()).toBe(true);
  });

  it('is active for one change in any group', () => {
    setPassageSort('most-matches');
    flush();
    expect(hasActiveFilters()).toBe(true);
    resetFilters();
    flush();
    expect(hasActiveFilters()).toBe(false);
  });
});

describe('persistence', () => {
  it('saves nothing unless the setting is on', () => {
    toggleOption('regex');
    setStateSort('type');
    flush();
    expect(store.settings['search.saved.options']).toEqual(createDefaultOptions());
    expect(store.settings['search.saved.sort']).toEqual(createDefaultSort());
  });

  it('saves the parts that are switched on, as they change', () => {
    setSetting('search.persist.options', true);
    setSetting('search.persist.typeFilter', true);
    flush();
    toggleOption('caseSensitive');
    toggleType('boolean');
    setStateSort('type');
    flush();
    expect(store.settings['search.saved.options']).toMatchObject({ caseSensitive: true });
    expect(store.settings['search.saved.typeFilter']).toEqual(['boolean']);
    expect(store.settings['search.saved.sort']).toEqual(createDefaultSort());
  });

  it('saves the scope with its parts', () => {
    setSetting('search.persist.scope', true);
    flush();
    togglePassageScope('tags');
    flush();
    expect(store.settings['search.saved.scope'].passage.tags).toBe(false);
    expect(store.settings['search.saved.scope'].state).toEqual({ path: true, value: true });
  });

  it('never saves the search text or the tag filter', () => {
    setSetting('search.persist.options', true);
    setSearchText('secret');
    toggleTag('room');
    flush();
    expect(JSON.stringify(store.settings)).not.toContain('secret');
    expect(JSON.stringify(store.settings)).not.toContain('room');
  });
});
