import type { PathRecord } from '@/devtools-panel/store/game-state';
import type { JSONSafeValue } from '@/shared/shared-types';

export interface HistoryEntry {
  id: number;
  timestamp: number;
  /** What the value became. `undefined` when it was deleted */
  value: JSONSafeValue | undefined;
  /** What it was. `undefined` when it was added */
  before: JSONSafeValue | undefined;
}

export interface ValueHistory {
  /** Newest first */
  entries: HistoryEntry[];
  /** Changes that happened, but left the diff log window */
  forgotten: number;
}

export function getValueHistory(record: PathRecord | undefined): ValueHistory {
  if (!record) return { entries: [], forgotten: 0 };

  const entries = record.changes.map(({ id, timestamp, change }): HistoryEntry => {
    switch (change.kind) {
      case 'add':
        return { id, timestamp, value: change.value, before: undefined };
      case 'del':
        return { id, timestamp, value: undefined, before: change.value };
      default:
        return { id, timestamp, value: change.newValue, before: change.oldValue };
    }
  });
  return { entries, forgotten: record.count - entries.length };
}

export function sameHistory(a: ValueHistory, b: ValueHistory): boolean {
  return (
    a.forgotten === b.forgotten &&
    a.entries.length === b.entries.length &&
    a.entries.every((entry, index) => entry.id === b.entries[index]!.id)
  );
}

/** How much a number went up or down, like "+3". Nothing for other values */
export function describeDelta({ value, before }: HistoryEntry): string | undefined {
  if (typeof value !== 'number' || typeof before !== 'number') return undefined;
  const delta = Number((value - before).toPrecision(12));
  if (!Number.isFinite(delta) || delta === 0) return undefined;
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`;
}

export function describeChangeCount({ entries, forgotten }: ValueHistory): string {
  const total = entries.length + forgotten;
  return forgotten > 0 ? `${total} · ${forgotten} forgotten` : String(total);
}

/** The lowest and highest number the value had, with the one it has now */
export function describeRange(
  { entries }: ValueHistory,
  current: JSONSafeValue,
): string | undefined {
  const numbers = [current, ...entries.flatMap((entry) => [entry.value, entry.before])].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  if (typeof current !== 'number' || entries.length === 0) return undefined;
  return `${Math.min(...numbers)} – ${Math.max(...numbers)}`;
}
