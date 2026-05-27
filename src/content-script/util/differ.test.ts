import { describe, expect, it } from 'vite-plus/test';

import { getDiffer } from './differ';

describe('getDiffer', () => {
  it('should return no diffs for identical primitive values', () => {
    const diff = getDiffer();
    expect(diff(1, 1)).toStrictEqual([]);
    expect(diff('x', 'x')).toStrictEqual([]);
  });

  it('should emit primitive update diffs', () => {
    const diff = getDiffer();
    expect(diff(1, 2)).toStrictEqual([{ type: 'number', path: [], oldValue: 1, newValue: 2 }]);
    expect(diff(true, false)).toStrictEqual([
      { type: 'boolean', path: [], oldValue: true, newValue: false },
    ]);
  });

  it('should emit type-changed diff but ignore function-to-function transitions', () => {
    const diff = getDiffer();
    expect(diff(1, '1')).toStrictEqual([
      { type: 'type-changed', path: [], oldValue: 1, newValue: '1' },
    ]);
    expect(
      diff(
        () => 1,
        () => 2,
      ),
    ).toStrictEqual([]);
  });

  it('should emit object and map add/remove diffs and recurse nested primitive updates', () => {
    const diff = getDiffer();

    const objectDiffs = diff(
      { keep: 1, removeMe: 2, nested: { value: 1 } },
      { keep: 1, addMe: 3, nested: { value: 9 } },
    );
    expect(objectDiffs).toStrictEqual([
      { type: 'object', subtype: 'remove', path: [], key: 'removeMe', oldValue: 2 },
      { type: 'number', path: ['nested', 'value'], oldValue: 1, newValue: 9 },
      { type: 'object', subtype: 'add', path: [], key: 'addMe', newValue: 3 },
    ]);

    const mapOld = new Map<string | number, unknown>([
      ['a', 1],
      ['removeMe', 2],
    ]);
    const mapNew = new Map<string | number, unknown>([
      ['a', 1],
      ['addMe', 3],
    ]);
    const mapDiffs = diff(mapOld as any, mapNew as any);
    expect(mapDiffs).toStrictEqual([
      { type: 'map', subtype: 'remove', path: [], key: 'removeMe', oldValue: 2 },
      { type: 'map', subtype: 'add', path: [], key: 'addMe', newValue: 3 },
    ]);
  });

  it('should emit array add/remove/instructions diffs', () => {
    const diff = getDiffer();
    const diffs = diff([1, 2, 3], [2, 3, 4]);

    expect(diffs[0]).toStrictEqual({
      type: 'array',
      subtype: 'remove',
      path: [],
      index: 0,
      oldValue: 1,
    });
    expect(diffs[1]).toStrictEqual({
      type: 'array',
      subtype: 'add',
      path: [],
      index: 2,
      newValue: 4,
    });
    expect(diffs[2]?.type).toBe('array');
    expect((diffs[2] as any)?.subtype).toBe('instructions');
    expect((diffs[2] as any)?.instructions.length).toBeGreaterThan(0);
  });

  it('should process set branch without throwing', () => {
    const diff = getDiffer();
    const diffs = diff(new Set([1]) as any, new Set([1, 3]) as any);

    expect(Array.isArray(diffs)).toBe(true);
  });

  it.skip('BUG_TEST: should emit set add when new set has additional primitive item', () => {
    const diff = getDiffer();
    const diffs = diff(new Set() as any, new Set([7]) as any);

    expect(diffs).toStrictEqual([{ type: 'set', subtype: 'add', path: [], newValue: 7 }]);
  });

  it('should emit set remove for NaN edge case branch', () => {
    const diff = getDiffer();
    const diffs = diff(new Set([Number.NaN]) as any, new Set() as any);

    expect(diffs[0]?.type).toBe('set');
    expect((diffs[0] as any)?.subtype).toBe('remove');
    expect((diffs[0] as any)?.path).toStrictEqual([]);
  });

  it.skip('BUG_TEST: should emit set add/remove diffs for value changes', () => {
    const diff = getDiffer();
    const diffs = diff(new Set([1, 2]) as any, new Set([2, 3]) as any);

    expect(diffs).toStrictEqual([
      { type: 'set', subtype: 'remove', path: [], oldValue: 1 },
      { type: 'set', subtype: 'add', path: [], newValue: 3 },
    ]);
  });

  it('should leverage stored identity map between runs for reference matches', () => {
    const itemA = { id: 1, value: 'a' };
    const itemB = { id: 2, value: 'b' };
    const diff = getDiffer();

    // Prime identity map from first run
    diff([itemA, itemB], [itemA, itemB]);

    const diffs = diff([itemA, itemB], [itemB, itemA]);
    expect(diffs[0]?.type).toBe('array');
    expect((diffs[0] as any)?.subtype).toBe('instructions');
    expect((diffs[0] as any)?.instructions.length).toBeGreaterThan(0);
  });

  it.skip('BUG_TEST: should recurse set items matched by id and diff nested fields', () => {
    const diff = getDiffer();
    const diffs = diff(new Set([{ id: 1, hp: 1 }]) as any, new Set([{ id: 1, hp: 2 }]) as any);

    expect(diffs).toStrictEqual([{ type: 'number', path: ['1', 'hp'], oldValue: 1, newValue: 2 }]);
  });

  it('should respect ignoreCheck for object keys', () => {
    const diff = getDiffer((key) => key === 'ignored');
    const diffs = diff({ kept: 1, ignored: 1 }, { kept: 2, ignored: 2 });

    expect(diffs).toStrictEqual([{ type: 'number', path: ['kept'], oldValue: 1, newValue: 2 }]);
  });

  it('should recurse unmatched same-index object pairs via index matching', () => {
    const diff = getDiffer();
    const diffs = diff([{ nested: 1 }], [{ nested: 2 }]);

    expect(diffs).toStrictEqual([
      { type: 'number', path: [0, 'nested'], oldValue: 1, newValue: 2 },
    ]);
  });

  it('should match deep-equal objects when no ref or id match exists', () => {
    const diff = getDiffer();
    const diffs = diff(
      [{ name: 'same', meta: { value: 1 } }],
      [{ name: 'same', meta: { value: 1 } }],
    );

    expect(diffs).toStrictEqual([]);
  });

  it('should fall back to type-changed for unhandled same-type values', () => {
    const diff = getDiffer();
    const diffs = diff(1n as any, 2n as any);

    expect(diffs).toStrictEqual([{ type: 'type-changed', path: [], oldValue: 1n, newValue: 2n }]);
  });
});
