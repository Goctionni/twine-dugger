import type { Delta } from 'jsondiffpatch';

import type {
  ConnectionState,
  GameMetaData,
  JSONSafeValue,
  Lock,
  LockRevert,
  Page,
  Path,
  PropertyFilterKey,
  PropertyOrder,
} from '@/shared/shared-types';

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

/** A write to a locked path, that the lock undid */
export interface BlockedWrite extends LockRevert {
  /** What the path is locked at */
  locked: JSONSafeValue;
}

/** One poll's worth of changes, or a marker in the log. Immutable once created. */
export interface StateDiff {
  /** Sequential; the initial state is id 0, the first diff is id 1 */
  id: number;
  timestamp: number;
  passage: string;
  /** Missing when nothing in the state changed, for instance when a lock undid a write */
  delta?: Delta;
  blocked: BlockedWrite[];
  /** The game was reloaded here: the frames before this one can be read, but not travelled to */
  reloaded?: boolean;
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
