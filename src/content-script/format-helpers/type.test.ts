import { describe, expect, it } from 'vite-plus/test';

import type { FormatHelpers } from './type';

describe('FormatHelpers type contract', () => {
  it('should support expected helper method signatures', () => {
    const helper: FormatHelpers = {
      detect: () => true,
      getPassage: () => 'Start',
      getState: () => ({ hp: 10 }),
      setState: () => {},
      duplicateStateProperty: () => {},
      deleteFromState: () => {},
      getDiffer: () => () => [],
      processDiffs: (diffs) => ({ diffs, locksUpdate: [] }),
      setStatePropertyLock: () => [['player']],
      setStatePropertyLocks: () => {},
    };

    expect(helper.detect()).toBe(true);
    expect(helper.getPassage()).toBe('Start');
    expect(helper.getState()).toStrictEqual({ hp: 10 });
    expect(helper.getDiffer()({}, {} as never)).toStrictEqual([]);
    expect(helper.processDiffs?.([])).toStrictEqual({ diffs: [], locksUpdate: [] });
    expect(helper.setStatePropertyLock(['player'], true)).toStrictEqual([['player']]);
  });
});
