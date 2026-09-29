import type { Delta } from 'jsondiffpatch';

import type { ContainerType } from '@/shared/json-safe';
import type {
  ConnectionState,
  GameMetaData,
  Lock,
  Page,
  Path,
  PropertyFilterKey,
  PropertyOrder,
} from '@/shared/shared-types';

import type { DiffChange } from './delta';

export type { Page, Path };

export interface StoreData {
  connectionState: ConnectionState;
  gameMeta: GameMetaData | null;
  candidateIframes: string[];
  gameConfig: GameConfig;
  settings: Settings;
  viewState: {
    activeTab: Page;
    state: {
      /** Id of the state slice being inspected, or 'latest' to follow the live state */
      historyRef: number | 'latest';
      path: Path;
    };
    passage: {
      selected: string | null;
    };
    search: {
      query: string;
      resultTab: 'state' | 'passage';
    };
  };
}

/** One poll's worth of changes (or a marker in the log). Immutable once created. */
export interface StateDiff {
  /** Sequential; the initial state is id 0, the first diff is id 1 */
  id: number;
  timestamp: number;
  passage: string;
  /** Missing when nothing in the state changed, for instance when a lock undid a change */
  delta?: Delta;
  changes: DiffChange[];
  /** How many times in a row this same frame happened (only for frames without a delta) */
  repeats?: number;
}

export interface GameConfig {
  /** The locked paths and the values they are locked at */
  locks: Lock[];
  filteredPaths: Path[];
}

export interface Settings {
  'diffLog.fontSize': number;
  'diffLog.pollingInterval': number;
  'diffLog.maxHistorySlices': number;
  'diffLog.headingStyle': 'default' | 'distinct';
  'state.propertyOrder': PropertyOrder;
  'state.propertyOrderDesc': boolean;
  'state.filters': PropertyFilterKey[];
}

export type { ContainerType };
