import type { Delta } from 'jsondiffpatch';

import type { ContainerType } from '@/shared/json-safe';
import type {
  ConnectionState,
  GameMetaData,
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

/** One poll's worth of changes. Immutable once created. */
export interface StateDiff {
  /** Sequential; the initial state is id 0, the first diff is id 1 */
  id: number;
  timestamp: number;
  passage: string;
  delta: Delta;
  changes: DiffChange[];
}

export interface GameConfig {
  lockedPaths: Path[];
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
