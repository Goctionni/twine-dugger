import { createContext, useContext } from 'solid-js';

import type { Selection } from './selection';

/** Which result is open: the page's, not the search's */
export const SelectionContext = createContext<Selection>();
export const useSelection = () => useContext(SelectionContext);
