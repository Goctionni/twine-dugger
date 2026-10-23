import { describe, expect, it } from 'vite-plus/test';

import { NAN_MARKER, UNDEFINED_MARKER } from '@/shared/json-safe';

import { createUpdateTracker } from './update-tracker';

describe('createUpdateTracker', () => {
  it('reports what changed since the last time it was asked', () => {
    const live = { hp: 10 };
    const tracker = createUpdateTracker(() => live);

    live.hp = 9;
    expect(tracker.getDelta()).toEqual({ hp: [10, 9] });
    expect(tracker.getDelta()).toBeUndefined();
  });

  it('starts over from the state it hands out when reset', () => {
    const live = { hp: 10 };
    const tracker = createUpdateTracker(() => live);

    live.hp = 9;
    expect(tracker.reset()).toEqual({ hp: 9 });
    expect(tracker.getDelta()).toBeUndefined();
  });
});

describe('createUpdateTracker with values that cannot be sent', () => {
  it('does not report NaN as a change every time, and sees NaN become a number', () => {
    const live: Record<string, number | undefined> = { score: Number.NaN, gone: undefined };
    const tracker = createUpdateTracker(() => live);

    expect(tracker.getDelta()).toBeUndefined();
    live.score = 0;
    expect(tracker.getDelta()).toEqual({ score: [NAN_MARKER, 0] });
    live.gone = 3;
    expect(tracker.getDelta()).toEqual({ gone: [UNDEFINED_MARKER, 3] });
  });
});
