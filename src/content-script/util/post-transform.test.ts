import { describe, expect, it } from 'vite-plus/test';

import {
  NAN_MARKER,
  NEGATIVE_INFINITY_MARKER,
  POSITIVE_INFINITY_MARKER,
  SET_MARKER,
  TYPE_KEY,
  UNDEFINED_MARKER,
} from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { setState } from '../format-helpers/shared';
import { posttransformValue } from './post-transform';

const map = (entries: Record<string, unknown> = {}) =>
  ({ [TYPE_KEY]: 'Map', ...entries }) as unknown as JSONSafeValue;
const functionMarker = { [TYPE_KEY]: 'function', str: 'x' } as unknown as JSONSafeValue;

describe('the value itself, with or without deep', () => {
  it.each([{ deep: false }, { deep: true }])(
    'makes a Map, a NumberMap, a Set and a Date from their marked form ($deep)',
    (options) => {
      expect(posttransformValue(map({ a: 1 }), options)).toEqual(new Map([['a', 1]]));
      expect(posttransformValue({ [TYPE_KEY]: 'NumberMap', 1: 'one' } as never, options)).toEqual(
        new Map([[1, 'one']]),
      );
      expect(posttransformValue([SET_MARKER, 1, 2], options)).toEqual(new Set([1, 2]));
      expect(
        posttransformValue(
          { [TYPE_KEY]: 'Date', Y: 2020, M: 1, D: 2, h: 3, m: 4, s: 5 } as never,
          options,
        ),
      ).toEqual(new Date(2020, 0, 2, 3, 4, 5));
    },
  );

  it.each([{ deep: false }, { deep: true }])(
    'turns a marker for NaN, Infinity and undefined into the value ($deep)',
    (options) => {
      expect(posttransformValue(NAN_MARKER, options)).toBeNaN();
      expect(posttransformValue(POSITIVE_INFINITY_MARKER, options)).toBe(Infinity);
      expect(posttransformValue(NEGATIVE_INFINITY_MARKER, options)).toBe(-Infinity);
      expect(posttransformValue(UNDEFINED_MARKER, options)).toBeUndefined();
    },
  );

  it.each([{ deep: false }, { deep: true }])('refuses a function ($deep)', (options) => {
    expect(() => posttransformValue(functionMarker, options)).toThrow(/function/);
  });

  it('leaves an unmarked value as it is: the same value, not a copy', () => {
    const object = { a: [1, { b: 'c' }], d: null };
    const array = [1, 2];
    expect(posttransformValue(object)).toBe(object);
    expect(posttransformValue(array)).toBe(array);
    expect(posttransformValue('text')).toBe('text');
    expect(posttransformValue(5)).toBe(5);
    expect(posttransformValue(null)).toBeNull();
  });

  it('puts a real Map in the state when a Map is added from the panel', () => {
    const state: Record<string, unknown> = { holder: {} };
    const sent = JSON.parse(JSON.stringify({ [TYPE_KEY]: 'Map' })) as JSONSafeValue;
    setState(state as never, ['holder', 'visits'], posttransformValue(sent));
    expect((state.holder as Record<string, unknown>).visits).toBeInstanceOf(Map);
  });
});

describe('without deep', () => {
  it('leaves what is inside the value as it is', () => {
    const inner = map({ k: 1 });
    const plain = { m: inner, n: NAN_MARKER };

    expect(posttransformValue(plain as never)).toBe(plain);
    expect(posttransformValue([inner, NAN_MARKER] as never)).toEqual([inner, NAN_MARKER]);
    expect(posttransformValue(map({ m: inner, n: NAN_MARKER }))).toEqual(
      new Map([
        ['m', inner],
        ['n', NAN_MARKER],
      ]),
    );
    expect(posttransformValue([SET_MARKER, inner, NAN_MARKER] as never)).toEqual(
      new Set([inner, NAN_MARKER]),
    );
  });

  it('does not look at a function inside the value', () => {
    expect(posttransformValue(map({ fn: functionMarker }))).toEqual(
      new Map([['fn', functionMarker]]),
    );
  });
});

describe('with deep', () => {
  it('turns the markers back into the values, at every depth', () => {
    const restored = posttransformValue(
      {
        nan: NAN_MARKER,
        up: POSITIVE_INFINITY_MARKER,
        down: NEGATIVE_INFINITY_MARKER,
        gone: UNDEFINED_MARKER,
        list: [UNDEFINED_MARKER],
      } as never,
      { deep: true },
    ) as Record<string, unknown>;

    expect(restored.nan).toBeNaN();
    expect(restored.up).toBe(Infinity);
    expect(restored.down).toBe(-Infinity);
    expect('gone' in restored && restored.gone).toBeUndefined();
    expect(restored.list).toEqual([undefined]);
    expect(posttransformValue([SET_MARKER, NAN_MARKER], { deep: true })).toEqual(
      new Set([Number.NaN]),
    );
  });

  it('restores a Map, Set or Date inside plain objects, arrays, Maps and Sets', () => {
    const date = { [TYPE_KEY]: 'Date', Y: 2020, M: 1, D: 2, h: 3, m: 4, s: 5 };
    const restored = posttransformValue(
      {
        plain: { m: map({ k: 1 }) },
        list: [[SET_MARKER, 1]],
        d: date,
        outer: map({ in: map() }),
      } as never,
      { deep: true },
    ) as Record<string, any>;

    expect(restored.plain.m).toEqual(new Map([['k', 1]]));
    expect(restored.list[0]).toEqual(new Set([1]));
    expect(restored.d).toEqual(new Date(2020, 0, 2, 3, 4, 5));
    expect(restored.outer.get('in')).toBeInstanceOf(Map);
  });

  it('refuses a function at any depth', () => {
    expect(() => posttransformValue({ a: [functionMarker] } as never, { deep: true })).toThrow(
      /function/,
    );
  });
});
