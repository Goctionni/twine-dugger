import { describe, expect, it } from 'vite-plus/test';

import { NAN_MARKER, TYPE_KEY, UNDEFINED_MARKER } from '@/shared/json-safe';

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

describe('createUpdateTracker with a Date', () => {
  it('reports a Date that changes as one change of one value', () => {
    const live: Record<string, any> = { when: new Date(2020, 0, 2, 3, 4, 5) };
    const tracker = createUpdateTracker(() => live);

    live.when = new Date(2020, 0, 2, 3, 34, 5);
    expect(tracker.getDelta()).toEqual({
      when: [`${TYPE_KEY}: Date 2020-01-02T03:04:05`, `${TYPE_KEY}: Date 2020-01-02T03:34:05`],
    });
    expect(tracker.getDelta()).toBeUndefined();
  });

  it('sees a Date that is changed in place, and not one that is only made again', () => {
    const live: Record<string, any> = { when: new Date(2020, 0, 2, 3, 4, 5) };
    const tracker = createUpdateTracker(() => live);

    live.when = new Date(2020, 0, 2, 3, 4, 5);
    expect(tracker.getDelta()).toBeUndefined();
    live.when.setMinutes(10);
    expect(tracker.getDelta()).toBeDefined();
  });
});
