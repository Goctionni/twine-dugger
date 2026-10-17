import { createMemo } from 'solid-js';

import { createSetSetting, getSettings, setSetting } from '@/devtools-panel/store/store';
import { sameItems } from '@/devtools-panel/utils/same-items';
import type { PropertyOrder, ValueType } from '@/shared/shared-types';

import { TYPE_ORDER } from '../logic/sort-keys';
import type { Sort } from '../types';

// The sort and the filter of the toolbar are kept in the settings that the old State view had, so
// that the people who chose them keep them
const SORT_BY_ORDER: Record<PropertyOrder, Sort> = {
  'alphabetic': 'name',
  'type': 'type',
  'most-recent': 'changed',
  'none': 'type',
};
const ORDER_BY_SORT: Record<Sort, PropertyOrder> = {
  name: 'alphabetic',
  type: 'type',
  changed: 'most-recent',
};

export const getNavigator = getSettings.state.navigator;
export const setNavigator = createSetSetting('state.navigator');

export const getSort = (): Sort => SORT_BY_ORDER[getSettings.state.propertyOrder()];
export const setSort = (sort: Sort) => setSetting('state.propertyOrder', ORDER_BY_SORT[sort]);

const isFilterType = (filter: string): filter is ValueType =>
  (TYPE_ORDER as string[]).includes(filter);

export const getHiddenTypes = createMemo(() => getSettings.state.filters().filter(isFilterType), {
  equals: sameItems,
});

/** What the old filter hid and the toolbar has no type for ('null', 'filtered', ...) is kept as it is */
export function setHiddenTypes(hiddenTypes: ValueType[]) {
  const kept = getSettings.state.filters().filter((filter) => !isFilterType(filter));
  setSetting('state.filters', [...kept, ...hiddenTypes]);
}
