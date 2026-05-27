import { beforeEach, describe, expect, it } from 'vite-plus/test';

import harlowe from './harlowe';

describe('harlowe format helper', () => {
  beforeEach(() => {
    (window as any).Harlowe = undefined;
  });

  it('should detect valid Harlowe shape', () => {
    (window as any).Harlowe = { API_ACCESS: { STATE: { variables: {} } } };
    expect(harlowe.detect()).toBe(true);
  });

  it('should reject invalid Harlowe shape', () => {
    (window as any).Harlowe = { API_ACCESS: { STATE: {} } };
    expect(harlowe.detect()).toBe(false);
  });

  it('should sanitize TwineScript keys from state output', () => {
    (window as any).Harlowe = {
      API_ACCESS: {
        STATE: {
          passage: 'Start',
          variables: {
            keep: 1,
            TwineScript_X: 2,
            nestedBad: { TwineScript_Y: true, a: 1 },
            nestedGood: { a: 1 },
          },
        },
      },
    };

    expect(harlowe.getState()).toStrictEqual({ keep: 1, nestedGood: { a: 1 } });
    expect(harlowe.getPassage()).toBe('Start');
  });

  it('should ignore TwineScript changes in differ output', () => {
    const differ = harlowe.getDiffer();
    const diffs = differ(
      { keep: 1, TwineScript_A: 1, nestedBad: { TwineScript_B: true, a: 1 } } as any,
      { keep: 2, TwineScript_A: 2, nestedBad: { TwineScript_B: false, a: 2 } } as any,
    );

    expect(diffs).toStrictEqual([{ type: 'number', path: ['keep'], oldValue: 1, newValue: 2 }]);
  });
});
