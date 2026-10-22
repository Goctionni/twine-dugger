import type { LockStatus, Path, ValueType } from '@/shared/shared-types';

export type BulkKind = 'none' | 'mixed' | 'other' | 'number' | 'string' | 'boolean';

/** What the selected values have in common, to know which input edits them all at once */
export function getBulkKind(types: readonly ValueType[]): BulkKind {
  const first = types[0];
  if (first === undefined) return 'none';
  if (types.some((type) => type !== first)) return 'mixed';
  return first === 'number' || first === 'string' || first === 'boolean' ? first : 'other';
}

/** The first selected value is the one the bulk input starts from: the order is the grid's */
export function getKeysOfType<K>(
  keys: readonly K[],
  getType: (key: K) => ValueType,
  type: ValueType,
) {
  return keys.filter((key) => getType(key) === type);
}

export type BulkLockState = 'unlocked' | 'some-locked' | 'locked';

/** Of the properties that can be locked: none, all or some of them are */
export function getBulkLockState(statuses: readonly LockStatus[]): BulkLockState {
  const locked = statuses.filter((status) => status === 'locked').length;
  if (locked === 0) return 'unlocked';
  return locked === statuses.length ? 'locked' : 'some-locked';
}

/** The items of an array go from the last one: each delete moves the ones after it */
export function sortForDeletion(paths: readonly Path[]): Path[] {
  return paths.toSorted((a, b) => {
    const x = a.at(-1);
    const y = b.at(-1);
    return typeof x === 'number' && typeof y === 'number' ? y - x : 0;
  });
}
