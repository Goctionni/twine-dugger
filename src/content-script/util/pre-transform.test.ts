import { describe, expect, it } from 'vite-plus/test';

import {
  NAN_MARKER,
  NEGATIVE_INFINITY_MARKER,
  POSITIVE_INFINITY_MARKER,
  SET_MARKER,
  TYPE_KEY,
  UNDEFINED_MARKER,
} from '@/shared/json-safe';

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

describe('markers for the values that do not survive the trip', () => {
  it('stands in for NaN, the infinities and undefined, at every depth', () => {
    const [state] = pretransformState({
      nan: Number.NaN,
      up: Infinity,
      down: -Infinity,
      gone: undefined,
      zero: 0,
      empty: '',
      list: [1, undefined, Number.NaN],
      map: new Map<string, unknown>([['k', undefined]]) as never,
      set: new Set([Infinity]) as never,
    });

    expect(state).toEqual({
      nan: NAN_MARKER,
      up: POSITIVE_INFINITY_MARKER,
      down: NEGATIVE_INFINITY_MARKER,
      gone: UNDEFINED_MARKER,
      zero: 0,
      empty: '',
      list: [1, UNDEFINED_MARKER, NAN_MARKER],
      map: { '__twinedugger-type': 'Map', 'k': UNDEFINED_MARKER },
      set: [SET_MARKER, POSITIVE_INFINITY_MARKER],
    });
  });
});

describe('pretransformState with a Date', () => {
  it('writes a Date as one string, at any depth, and an invalid Date as invalid', () => {
    const [state] = pretransformState({
      when: new Date(2020, 0, 2, 3, 4, 5, 678),
      nested: { list: [new Date(2021, 5, 6, 7, 8, 9)] },
      broken: new Date(Number.NaN),
    } as never);

    expect(state).toEqual({
      when: `${TYPE_KEY}: Date 2020-01-02T03:04:05`,
      nested: { list: [`${TYPE_KEY}: Date 2021-06-06T07:08:09`] },
      broken: `${TYPE_KEY}: Date Invalid`,
    });
  });
});
