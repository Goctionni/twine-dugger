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
  type ValueType,
} from '@/shared/shared-types';

import type { SearchOptions, SearchScope, SearchSort, SearchView } from '../search/core/types';

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
      options: SearchOptions;
      scope: SearchScope;
      sort: SearchSort;
      /** Value types to show in state results; empty = all */
      typeFilter: ValueType[];
      /** Passage tags to require; empty = all. Game specific, never persisted */
      tagFilter: string[];
      view: SearchView;
      collapsed: { state: boolean; passage: boolean };
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
  'editor.syntaxHighlighting': "'always' | 'small' | 'never'",
  'search.narrowStyle': "'strip' | 'bar'",
  // Which search options are remembered between sessions (the query and tag filter never are)
  'search.persist.options': 'boolean',
  'search.persist.scope': 'boolean',
  'search.persist.sort': 'boolean',
  'search.persist.typeFilter': 'boolean',
  'search.saved.options': {
    caseSensitive: 'boolean',
    wholeWord: 'boolean',
    regex: 'boolean',
  },
  'search.saved.scope': {
    statePath: 'boolean',
    stateValue: 'boolean',
    passageName: 'boolean',
    passageTags: 'boolean',
    passageContent: 'boolean',
  },
  'search.saved.sort': {
    state: "'source' | 'path-asc' | 'path-desc' | 'type' | 'recent'",
    passage: "'match' | 'most-matches' | 'name-asc' | 'name-desc'",
  },
  'search.saved.typeFilter': valueTypeSchema.array(),
});
export type Settings = typeof settingsSchema.infer;
