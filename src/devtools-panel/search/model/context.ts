import { createContext, useContext } from 'solid-js';

import type { SearchModel } from '../types';
import type { Selection } from './selection';

/** What the search found; what it was told is in `search-state` */
export const SearchContext = createContext<SearchModel>();
export const useSearch = () => useContext(SearchContext);

/** Which result is open: the page's, not the search's */
export const SelectionContext = createContext<Selection>();
export const useSelection = () => useContext(SelectionContext);
