import type { Delta } from 'jsondiffpatch';

import type { JSONSafeValue, LockRevert, Path } from '@/shared/shared-types';

export interface BlockedWrite extends LockRevert {
  locked: JSONSafeValue;
}

export interface StateDiff {
  id: number;
  timestamp: number;
  passage: string;
  delta?: Delta;
  blocked: BlockedWrite[];
  reloaded?: boolean;
}

export type DiffChange =
  | { kind: 'add' | 'del'; path: Path; value: JSONSafeValue }
  | { kind: 'chg' | 'typ'; path: Path; oldValue: JSONSafeValue; newValue: JSONSafeValue }
  | { kind: 'mov'; path: Path };

export type DiffKind = DiffChange['kind'];
