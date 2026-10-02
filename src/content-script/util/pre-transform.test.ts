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

  it('marks the maps that have number keys', () => {
    const [state] = pretransformState({
      numbers: new Map<unknown, unknown>([
        [1, 'a'],
        ['name', 'b'],
      ]) as never,
      strings: new Map<unknown, unknown>([['1', 'a']]) as never,
    });

    expect(state).toEqual({
      numbers: { '__twinedugger-type': 'NumberMap', '1': 'a', 'name': 'b' },
      strings: { '__twinedugger-type': 'Map', '1': 'a' },
    });
  });
});
