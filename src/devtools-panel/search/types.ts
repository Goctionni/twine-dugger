import type { Accessor } from 'solid-js';

import type { JSONSafeObject, ParsedPassageData } from '@/shared/shared-types';

/** Note that these are not tailwind breakpoints */
export type Breakpoint = 'sm' | 'md' | 'lg';
export type FilterLayout = 'full-sidebar' | 'icon-sidebar' | 'top-bar';
export type DetailMode = 'column' | 'sheet';

/** Where the search reads from; `gameData` is the game that is being inspected */
export interface SearchData {
  passages: Accessor<readonly ParsedPassageData[]>;
  /** Changes whenever the state does, so the state is searched again */
  stateVersion: Accessor<number>;
  /** The state as plain data. Reading it is not tracked; `stateVersion` says when to look again */
  getState: () => JSONSafeObject;
  /** Higher = changed more recently */
  getLastChange: (key: string) => number;
}
