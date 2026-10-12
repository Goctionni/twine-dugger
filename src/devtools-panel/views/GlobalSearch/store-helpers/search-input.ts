import { createSignal, untrack } from 'solid-js';

import { getSettings } from '../../../store/store';
import type { SearchOptions } from '../types';
import { createDefaultOptions } from '../utils/search-defaults';

// What is searched for is here and not in the search bar so that it is still there after visiting
// another page

export const [getSearchText, setSearchText] = createSignal('');

/** Starts as the settings remember it. A new object for every change */
export const [getSearchOptions, setSearchOptions] = createSignal<SearchOptions>(
  untrack(() =>
    getSettings.search.persist.options()
      ? { ...getSettings.search.saved.options() }
      : createDefaultOptions(),
  ),
);
