import { describe, expect, it } from 'vite-plus/test';

import { getDiffer } from './differ';

describe('getDiffer', () => {
  it('should return no diffs for identical primitive values', () => {
    const diff = getDiffer();
    expect(diff(1, 1)).toEqual([]);
    expect(diff('x', 'x')).toEqual([]);
  });

  it('should emit primitive update diffs', () => {
    const diff = getDiffer();
    expect(diff(1, 2)).toEqual([{ type: 'number', path: [], oldValue: 1, newValue: 2 }]);
    expect(diff(true, false)).toEqual([
      { type: 'boolean', path: [], oldValue: true, newValue: false },
    ]);
  });

  it('should emit type-changed diff but ignore function-to-function transitions', () => {
    const diff = getDiffer();
    expect(diff(1, '1')).toEqual([{ type: 'type-changed', path: [], oldValue: 1, newValue: '1' }]);
    expect(
      diff(
        () => 1,
        () => 2,
      ),
    ).toEqual([]);
  });

  it('should emit object and map add/remove diffs and recurse nested primitive updates', () => {
    const diff = getDiffer();

    const objectDiffs = diff(
      { keep: 1, removeMe: 2, nested: { value: 1 } },
      { keep: 1, addMe: 3, nested: { value: 9 } },
    );
    expect(objectDiffs).toEqual(
      expect.arrayContaining([
        { type: 'object', subtype: 'remove', path: [], key: 'removeMe', oldValue: 2 },
        { type: 'object', subtype: 'add', path: [], key: 'addMe', newValue: 3 },
        { type: 'number', path: ['nested', 'value'], oldValue: 1, newValue: 9 },
      ]),
    );

    const mapOld = new Map<string | number, unknown>([
      ['a', 1],
      ['removeMe', 2],
    ]);
    const mapNew = new Map<string | number, unknown>([
      ['a', 1],
      ['addMe', 3],
    ]);
    const mapDiffs = diff(mapOld as any, mapNew as any);
    expect(mapDiffs).toEqual(
      expect.arrayContaining([
        { type: 'map', subtype: 'remove', path: [], key: 'removeMe', oldValue: 2 },
        { type: 'map', subtype: 'add', path: [], key: 'addMe', newValue: 3 },
      ]),
    );
  });

  it('should emit array add/remove/instructions diffs', () => {
    const diff = getDiffer();
    const diffs = diff([1, 2, 3], [2, 3, 4]);

    expect(diffs).toEqual(
      expect.arrayContaining([
        { type: 'array', subtype: 'remove', path: [], index: 0, oldValue: 1 },
        { type: 'array', subtype: 'add', path: [], index: 2, newValue: 4 },
      ]),
    );
    expect(
      diffs.some(
        (item) =>
          item.type === 'array' && item.subtype === 'instructions' && item.instructions.length,
      ),
    ).toBe(true);
  });

  it('should process set branch without throwing', () => {
    const diff = getDiffer();
    const diffs = diff(new Set([1]) as any, new Set([1, 3]) as any);

    expect(Array.isArray(diffs)).toBe(true);
  });

  it('should leverage stored identity map between runs for reference matches', () => {
    const itemA = { id: 1, value: 'a' };
    const itemB = { id: 2, value: 'b' };
    const diff = getDiffer();

    // Prime identity map from first run
    diff([itemA, itemB], [itemA, itemB]);

    const diffs = diff([itemA, itemB], [itemB, itemA]);
    expect(
      diffs.some(
        (item) =>
          item.type === 'array' && item.subtype === 'instructions' && item.instructions.length,
      ),
    ).toBe(true);
  });

  it('should respect ignoreCheck for object keys', () => {
    const diff = getDiffer((key) => key === 'ignored');
    const diffs = diff({ kept: 1, ignored: 1 }, { kept: 2, ignored: 2 });

    expect(diffs).toEqual([{ type: 'number', path: ['kept'], oldValue: 1, newValue: 2 }]);
  });

  it('should recurse unmatched same-index object pairs via index matching', () => {
    const diff = getDiffer();
    const diffs = diff([{ nested: 1 }], [{ nested: 2 }]);

    expect(diffs).toEqual(
      expect.arrayContaining([{ type: 'number', path: [0, 'nested'], oldValue: 1, newValue: 2 }]),
    );
  });

  it('should match deep-equal objects when no ref or id match exists', () => {
    const diff = getDiffer();
    const diffs = diff(
      [{ name: 'same', meta: { value: 1 } }],
      [{ name: 'same', meta: { value: 1 } }],
    );

    expect(diffs).toEqual([]);
  });

  it('should fall back to type-changed for unhandled same-type values', () => {
    const diff = getDiffer();
    const diffs = diff(1n as any, 2n as any);

    expect(diffs).toEqual([{ type: 'type-changed', path: [], oldValue: 1n, newValue: 2n }]);
  });
});
