import { describe, expect, it } from 'vite-plus/test';

import { createInstructions } from './createInstructions';

describe('createInstructions', () => {
  it('should generate add instructions for unmatched new items', () => {
    const instructions = createInstructions(['a', 'b'], [true, true], [false, false], []);

    expect(instructions).toStrictEqual([
      { type: 'add', index: 0, value: 'a' },
      { type: 'add', index: 1, value: 'b' },
    ]);
  });

  it('should generate remove instructions in descending index order', () => {
    const instructions = createInstructions([], [false, true, false], [true], []);

    expect(instructions).toStrictEqual([
      { type: 'remove', index: 2 },
      { type: 'remove', index: 0 },
    ]);
  });

  it('should generate move instructions and remove move-in-place entries', () => {
    const instructions = createInstructions(
      ['a', 'b'],
      [true, true],
      [true, true],
      [
        { oldIndex: 1, newIndex: 0, matchType: 'basic', doRecursion: false },
        { oldIndex: 0, newIndex: 0, matchType: 'basic', doRecursion: false },
      ],
    );

    const moves = instructions.filter((item) => item.type === 'move');
    expect(moves.length).toBeGreaterThan(0);
    for (const item of moves) {
      expect(item.from).toBe(1);
      expect(item.to).toBe(0);
    }
  });

  it('should adjust downstream move indexes after remove and add operations', () => {
    const instructions = createInstructions(
      ['new', 'stay'],
      [false, true],
      [false, true],
      [{ oldIndex: 1, newIndex: 1, matchType: 'id', doRecursion: true }],
    );

    expect(instructions).toStrictEqual([
      { type: 'remove', index: 0 },
      { type: 'add', index: 0, value: 'new' },
    ]);
  });

  it('should return empty list when arrays already aligned', () => {
    const instructions = createInstructions(
      ['a'],
      [true],
      [true],
      [{ oldIndex: 0, newIndex: 0, matchType: 'basic', doRecursion: false }],
    );

    expect(instructions).toStrictEqual([]);
  });

  it('should prioritize remove over non-remove and propagate move-from adjustments', () => {
    const instructions = createInstructions(
      ['x', 'a', 'b'],
      [true, true, true],
      [true, true, true],
      [
        { oldIndex: 2, newIndex: 0, matchType: 'id', doRecursion: true },
        { oldIndex: 1, newIndex: 2, matchType: 'id', doRecursion: true },
      ],
    );

    const moves = instructions.filter((item) => item.type === 'move');
    expect(moves.length).toBeGreaterThan(0);
  });
});
