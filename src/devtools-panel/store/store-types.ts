import { type } from 'arktype';

import {
  lockSchema,
  pathSchema,
  propertyOrderSchema,
  valueTypeSchema,
  type ConnectionState,
  type GameMetaData,
  type Page,
  type Path,
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

export const gameConfigSchema = type({
  locks: lockSchema.array(),
  filteredPaths: pathSchema.array(),
});
export type GameConfig = typeof gameConfigSchema.infer;

export const settingsSchema = type({
  'diffLog.fontSize': 'number',
  'diffLog.pollingInterval': 'number',
  'diffLog.maxHistorySlices': 'number',
  'diffLog.headingStyle': "'default' | 'distinct'",
  'state.propertyOrder': propertyOrderSchema,
  'state.propertyOrderDesc': 'boolean',
  'state.filters': valueTypeSchema.or("'filtered'").array(),
});
export type Settings = typeof settingsSchema.infer;
