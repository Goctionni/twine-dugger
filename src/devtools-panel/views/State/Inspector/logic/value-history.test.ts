import { describe, expect, it } from 'vite-plus/test';

import type { PathRecord } from '@/devtools-panel/store/game-state';
import { NAN_MARKER, POSITIVE_INFINITY_MARKER } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import {
  describeChangeCount,
  describeDelta,
  describeRange,
  getLastValidValue,
  getNumberSeries,
  getValueHistory,
  type HistoryEntry,
} from './value-history';

it('has nothing for a path that never changed', () => {
  expect(getValueHistory(undefined)).toEqual({ entries: [], forgotten: 0 });
});

it('turns the changes of a path into entries, and counts the forgotten ones', () => {
  const record: PathRecord = {
    changes: [
      { id: 7, timestamp: 70, change: { kind: 'chg', path: ['n'], oldValue: 2, newValue: 3 } },
      { id: 5, timestamp: 50, change: { kind: 'add', path: ['n'], value: 2 } },
    ],
    count: 4,
    lastId: 7,
    lastTimestamp: 70,
  };

  expect(getValueHistory(record)).toEqual({
    entries: [
      { id: 7, timestamp: 70, value: 3, before: 2 },
      { id: 5, timestamp: 50, value: 2, before: undefined },
    ],
    forgotten: 2,
  });
});

it('shows a deleted value as an entry without a new value', () => {
  const record: PathRecord = {
    changes: [{ id: 2, timestamp: 20, change: { kind: 'del', path: ['n'], value: 'x' } }],
    count: 1,
    lastId: 2,
    lastTimestamp: 20,
  };
  expect(getValueHistory(record).entries).toEqual([
    { id: 2, timestamp: 20, value: undefined, before: 'x' },
  ]);
});

it('describes how far a number moved', () => {
  const entry = (value: any, before: any) => ({ id: 1, timestamp: 1, value, before });
  expect(describeDelta(entry(13, 10))).toBe('+3');
  expect(describeDelta(entry(0.3, 0.1))).toBe('+0.2');
  expect(describeDelta(entry(9, 10))).toBe('−1');
  expect(describeDelta(entry('b', 'a'))).toBeUndefined();
  expect(describeDelta(entry(1, undefined))).toBeUndefined();
});

it('counts the changes and finds the range', () => {
  const history = {
    entries: [
      { id: 3, timestamp: 3, value: 4, before: 20 },
      { id: 2, timestamp: 2, value: 20, before: 7 },
    ],
    forgotten: 1,
  };
  expect(describeChangeCount(history)).toBe('3 · 1 forgotten');
  expect(describeChangeCount({ ...history, forgotten: 0 })).toBe('2');
  expect(describeRange(history, 4)).toBe('4 – 20');
  expect(describeRange(history, 'text')).toBeUndefined();
  expect(describeRange({ entries: [], forgotten: 0 }, 4)).toBeUndefined();
});

describe('getLastValidValue', () => {
  const entry = (before: HistoryEntry['before']): HistoryEntry => ({
    id: 1,
    timestamp: 0,
    value: undefined,
    before,
  });

  it('is the most recent earlier value that the panel may write', () => {
    expect(getLastValidValue([entry(NAN_MARKER), entry(3), entry(1)])).toBe(3);
    expect(getLastValidValue([entry(POSITIVE_INFINITY_MARKER), entry('a')])).toBe('a');
    expect(getLastValidValue([entry(null)])).toBeNull();
    expect(getLastValidValue([entry(false)])).toBe(false);
  });

  it('is nothing when there is none, or only markers, undefined and containers', () => {
    expect(getLastValidValue([])).toBeUndefined();
    expect(
      getLastValidValue([entry(undefined), entry(NAN_MARKER), entry({ a: 1 })]),
    ).toBeUndefined();
  });
});

it('lists the numbers the value had, oldest first, from before the oldest change', () => {
  const entry = (
    id: number,
    value: JSONSafeValue | undefined,
    before: JSONSafeValue | undefined,
  ) => ({
    id,
    timestamp: id,
    value,
    before,
  });
  const entries = [entry(3, 9, 5), entry(2, 5, 'five'), entry(1, 'five', 1)];
  expect(getNumberSeries({ entries, forgotten: 0 })).toEqual([1, 5, 9]);
  expect(
    getNumberSeries({ entries: [entry(2, undefined, 4), entry(1, 4, 2)], forgotten: 0 }),
  ).toEqual([2, 4]);
  expect(getNumberSeries({ entries: [], forgotten: 0 })).toEqual([]);
});
