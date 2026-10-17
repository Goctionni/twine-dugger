import { flush } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';

import { getSettings, setSetting } from '@/devtools-panel/store/store';

import { getHiddenTypes, getSort, setHiddenTypes, setSort } from './view-prefs';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

it('keeps the sort in the setting of the old view', () => {
  setSetting('state.propertyOrder', 'most-recent');
  flush();
  expect(getSort()).toBe('changed');

  setSort('name');
  flush();
  expect(getSettings.state.propertyOrder()).toBe('alphabetic');

  setSetting('state.propertyOrder', 'none');
  flush();
  expect(getSort()).toBe('type');
});

it('keeps the hidden types in the filters of the old view, and what has no type in the toolbar', () => {
  setSetting('state.filters', ['null', 'filtered', 'string']);
  flush();
  expect([...getHiddenTypes()]).toEqual(['string']);

  setHiddenTypes(['number', 'other']);
  flush();
  expect([...getSettings.state.filters()]).toEqual(['null', 'filtered', 'number', 'other']);
  expect([...getHiddenTypes()]).toEqual(['number', 'other']);
});
