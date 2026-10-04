import { createRoot, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { setSetting, setStore, store } from '../../store/store';
import { defaultSearchOptions, defaultSearchScope, defaultSearchSort } from '../core/types';
import {
  createSearchPersistence,
  resetFilters,
  setQuery,
  setSort,
  toggleCollapsed,
  toggleOption,
  toggleScope,
  toggleTag,
  toggleType,
} from './search-state';

let dispose: () => void;
beforeEach(() => {
  setStore((draft) => {
    draft.viewState.search.options = { ...defaultSearchOptions };
    draft.viewState.search.scope = { ...defaultSearchScope };
    draft.viewState.search.sort = { ...defaultSearchSort };
    draft.viewState.search.typeFilter = [];
    draft.viewState.search.tagFilter = [];
    draft.settings['search.persist.options'] = false;
    draft.settings['search.persist.scope'] = false;
    draft.settings['search.persist.sort'] = false;
    draft.settings['search.persist.typeFilter'] = false;
    draft.settings['search.saved.options'] = { ...defaultSearchOptions };
    draft.settings['search.saved.scope'] = { ...defaultSearchScope };
    draft.settings['search.saved.sort'] = { ...defaultSearchSort };
    draft.settings['search.saved.typeFilter'] = [];
  });
  flush();
  createRoot((d) => {
    dispose = d;
    createSearchPersistence();
  });
});
afterEach(() => dispose());

describe('session state', () => {
  it('toggles options, scopes, types and tags', () => {
    toggleOption('regex');
    toggleScope('passageContent');
    toggleType('number');
    toggleTag('room');
    toggleCollapsed('state');
    flush();
    const search = store.viewState.search;
    expect(search.options.regex).toBe(true);
    expect(search.scope.passageContent).toBe(false);
    expect(search.typeFilter).toEqual(['number']);
    expect(search.tagFilter).toEqual(['room']);
    expect(search.collapsed.state).toBe(true);

    toggleType('number');
    toggleTag('room');
    flush();
    expect(store.viewState.search.typeFilter).toEqual([]);
    expect(store.viewState.search.tagFilter).toEqual([]);
  });

  it('resets scope, sort and filters but keeps the query and its options', () => {
    setQuery('abc');
    toggleOption('wholeWord');
    toggleScope('statePath');
    setSort('passage', 'name-asc');
    toggleType('string');
    toggleTag('room');
    flush();
    resetFilters();
    flush();
    const search = store.viewState.search;
    expect(search.query).toBe('abc');
    expect(search.options.wholeWord).toBe(true);
    expect(search.scope).toEqual(defaultSearchScope);
    expect(search.sort).toEqual(defaultSearchSort);
    expect(search.typeFilter).toEqual([]);
    expect(search.tagFilter).toEqual([]);
  });
});

describe('persistence', () => {
  it('saves nothing unless the setting is on', () => {
    toggleOption('regex');
    setSort('state', 'type');
    flush();
    expect(store.settings['search.saved.options']).toEqual(defaultSearchOptions);
    expect(store.settings['search.saved.sort']).toEqual(defaultSearchSort);
  });

  it('saves the slices that are switched on, as they change', () => {
    setSetting('search.persist.options', true);
    setSetting('search.persist.typeFilter', true);
    flush();
    toggleOption('caseSensitive');
    toggleType('boolean');
    setSort('state', 'type');
    flush();
    expect(store.settings['search.saved.options']).toMatchObject({ caseSensitive: true });
    expect(store.settings['search.saved.typeFilter']).toEqual(['boolean']);
    expect(store.settings['search.saved.sort']).toEqual(defaultSearchSort);
  });

  it('never saves the query or the tag filter', () => {
    setSetting('search.persist.options', true);
    setQuery('secret');
    toggleTag('room');
    flush();
    expect(JSON.stringify(store.settings)).not.toContain('secret');
    expect(JSON.stringify(store.settings)).not.toContain('room');
  });
});
