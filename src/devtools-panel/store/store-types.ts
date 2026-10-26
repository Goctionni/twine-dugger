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

import type { SearchScope, SearchSort } from '../views/GlobalSearch/types';

export interface StoreData {
  connectionState: ConnectionState;
  gameMeta: GameMetaData | null;
  candidateIframes: string[];
  gameConfig: GameConfig;
  settings: Settings;
  viewState: {
    activeTab: Page;
    state: {
      path: Path;
    };
    passages: {
      selected: string | null;
    };
    search: {
      scope: SearchScope;
      sort: SearchSort;
      typeFilter: ValueType[];
      tagFilter: string[];
    };
  };
}

export const gameConfigSchema = type({
  locks: lockSchema.array(),
  filteredPaths: pathSchema.array(),
  pins: pathSchema.array(),
});
export type GameConfig = typeof gameConfigSchema.infer;

export const settingsSchema = type({
  'diffLog.fontSize': 'number',
  'diffLog.pollingInterval': 'number',
  'diffLog.maxHistorySlices': 'number',
  'state.propertyOrder': propertyOrderSchema,
  'state.propertyOrderDesc': 'boolean',
  'state.filters': valueTypeSchema.or("'filtered'").array(),
  'state.recentUpdates': 'number',
  'state.typeAheadResetMs': 'number',
  'state.pinCascade': 'boolean',
  'filteredPaths.hiddenIn': "'diff-log' | 'state' | 'both'",
  'state.navigator': "'miller' | 'tree' | 'tiles'",
  'state.treeLayout': "'containers-and-primitives' | 'primitives-in-list'",
  'state.splitDirection': "'auto' | 'vertical' | 'horizontal'",
  'passages.splitDirection': "'auto' | 'vertical' | 'horizontal'",
  'editor.disableHighlighting': "'never' | 'very-large' | 'large' | 'normal' | 'always'",
  'search.smFilterLayout': "'icon-sidebar' | 'top-bar'",
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
    state: { path: 'boolean', value: 'boolean' },
    passage: { name: 'boolean', tags: 'boolean', content: 'boolean' },
  },
  'search.saved.sort': {
    state: "'source' | 'path-asc' | 'path-desc' | 'type' | 'recent'",
    passage: "'match' | 'most-matches' | 'name-asc' | 'name-desc'",
  },
  'search.saved.typeFilter': valueTypeSchema.array(),
});
export type Settings = typeof settingsSchema.infer;
