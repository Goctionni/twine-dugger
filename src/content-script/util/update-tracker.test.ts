import { describe, expect, it } from 'vite-plus/test';

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
