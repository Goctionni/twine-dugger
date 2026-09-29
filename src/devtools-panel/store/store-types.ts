import type { Delta } from 'jsondiffpatch';

import type {
  ConnectionState,
  GameMetaData,
  JSONSafeObject,
  PropertyFilterKey,
  PropertyOrder,
} from '@/shared/shared-types';

export interface StoreData {
  connectionState: ConnectionState;
  gameMeta: GameMetaData | null;
  candidateIframes: string[];
  gameState: JSONSafeObject;
  stateDiffs: StateDiff[];
  gameConfig: GameConfig;
  settings: Settings;
  viewState: {
    activeTab: Page;
    state: {
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

export type Page = 'state' | 'search' | 'passages' | 'settings';

export type Path = Array<string | number>;

export interface StateDiff {
  id: number; // timestamp
  passage: string;
  delta: Delta;
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
