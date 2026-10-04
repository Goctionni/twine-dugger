import { createContext, useContext } from 'solid-js';

import type { SearchModel } from './create-search';

/** The results of the search that is on the page; the state it is made from is in `search-state` */
export const SearchContext = createContext<SearchModel>();

export const useSearch = () => useContext(SearchContext);
