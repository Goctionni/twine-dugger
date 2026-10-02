import type {
  ConnectionState,
  GameMetaData,
  Lock,
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
      historyRef: number | 'latest';
      path: Path;
    };
    passages: {
      selected: string | null;
    };
    search: {
      query: string;
      resultTab: 'state' | 'passage';
    };
  };
}

export interface GameConfig {
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
