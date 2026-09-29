import { describe, expect, it } from 'vite-plus/test';

import { pretransformState } from './pre-transform';

describe('pretransformState', () => {
  it('leaves out TwineScript_ properties and objects that carry them', () => {
    const [state] = pretransformState({
      hp: 3,
      TwineScript_Internal: 1,
      macro: { TwineScript_TypeName: 'macro', body: 1 },
      carrier: { keep: 1, TwineScript_x: 2 },
      nested: { keep: 1, inner: { TwineScript_y: 1 } },
      map: new Map<string, unknown>([
        ['TwineScript_z', 1],
        ['ok', { TwineScript_w: 1 }],
        ['fine', 2],
      ]) as never,
    });

    expect(state).toEqual({
      hp: 3,
      nested: { keep: 1 },
      map: { '__twinedugger-type': 'Map', 'fine': 2 },
    });
  });
});
