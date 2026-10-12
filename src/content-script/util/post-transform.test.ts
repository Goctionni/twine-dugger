import { describe, expect, it } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { setState } from '../format-helpers/shared';
import { restoreMarkedJsonValue } from './post-transform';

describe('restoreSpecialValue', () => {
  it('makes a Map, a NumberMap, a Set and a Date from their marked form', () => {
    expect(restoreMarkedJsonValue({ [TYPE_KEY]: 'Map', a: 1 })).toEqual(new Map([['a', 1]]));
    expect(restoreMarkedJsonValue({ [TYPE_KEY]: 'NumberMap', 1: 'one' })).toEqual(
      new Map([[1, 'one']]),
    );
    expect(restoreMarkedJsonValue([SET_MARKER, 1, 2])).toEqual(new Set([1, 2]));
    expect(
      restoreMarkedJsonValue({ [TYPE_KEY]: 'Date', Y: 2020, M: 1, D: 2, h: 3, m: 4, s: 5 }),
    ).toEqual(new Date(2020, 0, 2, 3, 4, 5));
  });

  it('leaves everything else as it is: the same value, not a copy', () => {
    const object = { a: [1, { b: 'c' }], d: null };
    expect(restoreMarkedJsonValue(object)).toBe(object);
    expect(restoreMarkedJsonValue('text')).toBe('text');
    expect(restoreMarkedJsonValue(5)).toBe(5);
    expect(restoreMarkedJsonValue(null)).toBeNull();
    const array = [1, 2];
    expect(restoreMarkedJsonValue(array)).toBe(array);
  });

  it('puts a real Map in the state when a Map is added from the panel', () => {
    const state: Record<string, unknown> = { holder: {} };
    const sent = JSON.parse(JSON.stringify({ [TYPE_KEY]: 'Map' })) as JSONSafeValue;
    setState(state as never, ['holder', 'visits'], restoreMarkedJsonValue(sent));
    expect((state.holder as Record<string, unknown>).visits).toBeInstanceOf(Map);
  });
});
