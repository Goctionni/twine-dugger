import type { DiffFrame, ObjectValue, Path } from '@/shared/shared-types';

import { PathChunk } from '../types';

export interface NavigationAction {
  parentChunk: PathChunk;
  selectedChildKey: string | number;
}

export interface StateHistoryEntry {
  id: string;
  state: ObjectValue;
  timestamp: number;
}

export interface StateViewSelection {
  historyId: 'latest' | number;
  path: Path;
}

export interface HistoryItem {
  id: number;
  diffingFrame: DiffFrame | undefined;
  state: ObjectValue;
}

export interface HistoryNode {
  id: 'latest' | number;
  active: boolean;
}
