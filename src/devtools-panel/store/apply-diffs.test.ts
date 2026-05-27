import { describe, expect, it, vi } from 'vite-plus/test';

import { Diff } from '@/shared/shared-types';

import { applyDiffsToState } from './apply-diffs';

describe('applyDiffsToState', () => {
  it('should apply object and map add/remove changes', () => {
    const oldState = {
      obj: { keep: 1, removeMe: 2 },
      map: new Map<string | number, unknown>([
        ['keep', 1],
        ['removeMe', 2],
      ]),
    };

    const diffs: Diff[] = [
      { type: 'object', subtype: 'add', path: ['obj'], key: 'added', newValue: 3 },
      { type: 'object', subtype: 'remove', path: ['obj'], key: 'removeMe', oldValue: 2 },
      { type: 'map', subtype: 'add', path: ['map'], key: 'added', newValue: 3 },
      { type: 'map', subtype: 'remove', path: ['map'], key: 'removeMe', oldValue: 2 },
    ];

    const next = applyDiffsToState(oldState as any, diffs);

    expect(next.obj).toStrictEqual({ keep: 1, added: 3 });
    expect((next.map as Map<string | number, unknown>).get('added')).toBe(3);
    expect((next.map as Map<string | number, unknown>).has('removeMe')).toBe(false);
  });

  it('should apply array instruction diffs including add/remove/move', () => {
    const oldState = { arr: ['a', 'b', 'c'] };
    const diffs: Diff[] = [
      {
        type: 'array',
        subtype: 'instructions',
        path: ['arr'],
        instructions: [
          { type: 'remove', index: 1 },
          { type: 'add', index: 1, value: 'x' },
          { type: 'move', from: 2, to: 0 },
        ],
      },
    ];

    const next = applyDiffsToState(oldState as any, diffs);
    expect(next.arr).toStrictEqual(['c', 'a', 'x']);
  });

  it('should apply set add/remove changes', () => {
    const oldState = { s: new Set([1, 2]) };
    const diffs: Diff[] = [
      { type: 'set', subtype: 'add', path: ['s'], newValue: 3 },
      { type: 'set', subtype: 'remove', path: ['s'], oldValue: 1 },
    ];

    const next = applyDiffsToState(oldState as any, diffs);
    expect(Array.from(next.s as Set<number>).sort((a, b) => a - b)).toStrictEqual([2, 3]);
  });

  it('should ignore array diffs when subtype is not instructions', () => {
    const oldState = { arr: ['a', 'b'] };
    const diffs: Diff[] = [
      {
        type: 'array',
        subtype: 'add' as any,
        path: ['arr'],
        instructions: [{ type: 'add', index: 1, value: 'x' }],
      },
    ];

    const next = applyDiffsToState(oldState as any, diffs);
    expect(next.arr).toStrictEqual(['a', 'b']);
  });

  it('should ignore unknown array instruction types', () => {
    const oldState = { arr: ['a', 'b'] };
    const diffs: Diff[] = [
      {
        type: 'array',
        subtype: 'instructions',
        path: ['arr'],
        instructions: [{ type: 'noop' as any, index: 0 }],
      },
    ];

    const next = applyDiffsToState(oldState as any, diffs);
    expect(next.arr).toStrictEqual(['a', 'b']);
  });

  it('should not perform remove behavior for set add subtype', () => {
    const oldState = { s: new Set([1]) };
    const diffs: Diff[] = [{ type: 'set', subtype: 'add', path: ['s'], newValue: 2 }];

    const next = applyDiffsToState(oldState as any, diffs);
    expect(Array.from(next.s as Set<number>).sort((a, b) => a - b)).toStrictEqual([1, 2]);
  });

  it('should apply primitive updates into object, map, and array parents', () => {
    const oldState = {
      obj: { k: 1 },
      map: new Map<string | number, unknown>([['k', 1]]),
      arr: [1, 2],
    };

    const diffs: Diff[] = [
      { type: 'number', path: ['obj', 'k'], oldValue: 1, newValue: 5 },
      { type: 'number', path: ['map', 'k'], oldValue: 1, newValue: 6 },
      { type: 'number', path: ['arr', 0], oldValue: 1, newValue: 7 },
    ];

    const next = applyDiffsToState(oldState as any, diffs);

    expect((next.obj as any).k).toBe(5);
    expect((next.map as Map<string | number, unknown>).get('k')).toBe(6);
    expect((next.arr as any)[0]).toBe(7);
  });

  it('should log and skip when diff container path cannot be resolved', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const next = applyDiffsToState({ obj: {} } as any, [
      { type: 'object', subtype: 'add', path: ['missing'], key: 'k', newValue: 1 },
    ]);

    expect(next).toStrictEqual({ obj: {} });
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('should log and skip when resolved diff container type mismatches', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const next = applyDiffsToState({ obj: {} } as any, [
      { type: 'map', subtype: 'add', path: ['obj'], key: 'k', newValue: 1 },
    ]);

    expect(next).toStrictEqual({ obj: {} });
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('should log and skip primitive update when parent path cannot resolve', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const next = applyDiffsToState({ obj: {} } as any, [
      { type: 'number', path: ['missing', 'k'], oldValue: 1, newValue: 2 },
    ]);

    expect(next).toStrictEqual({ obj: {} });
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('should log and skip primitive update when parent is non-container', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const next = applyDiffsToState({ value: 1 } as any, [
      { type: 'number', path: ['value', 'k'], oldValue: 1, newValue: 2 },
    ]);

    expect(next).toStrictEqual({ value: 1 });
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
  });
});
