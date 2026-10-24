import { describe, expect, it } from 'vite-plus/test';

import { getTypeAheadTarget } from './get-type-ahead-target';

const names = ['alpha', 'Alto', 'beta', 'bravo', 'charlie', 'banana'];

describe('getTypeAheadTarget', () => {
  it('goes to the next item that starts with a letter, from the start when nothing is selected', () => {
    expect(getTypeAheadTarget(names, -1, 'b')).toBe(2);
    expect(getTypeAheadTarget(names, 2, 'b')).toBe(3);
    expect(getTypeAheadTarget(names, 3, 'b')).toBe(5);
    // Wraps around
    expect(getTypeAheadTarget(names, 5, 'b')).toBe(2);
    // The only one: it goes on to itself
    expect(getTypeAheadTarget(names, 4, 'c')).toBe(4);
  });

  it('does not care about the case', () => {
    expect(getTypeAheadTarget(names, -1, 'a')).toBe(0);
    expect(getTypeAheadTarget(names, 0, 'a')).toBe(1);
  });

  it('goes to the first item that starts with several letters, and stays when the selected one does', () => {
    expect(getTypeAheadTarget(names, -1, 'br')).toBe(3);
    expect(getTypeAheadTarget(names, 5, 'br')).toBe(3);
    expect(getTypeAheadTarget(names, 5, 'ba')).toBe(5);
    expect(getTypeAheadTarget(names, 2, 'b')).toBe(3);
    expect(getTypeAheadTarget(names, 0, 'al')).toBe(0);
  });

  it('keeps cycling when the same letter is typed several times', () => {
    expect(getTypeAheadTarget(names, 2, 'bb')).toBe(3);
    expect(getTypeAheadTarget(names, 3, 'bbb')).toBe(5);
  });

  it('finds nothing for letters that no item starts with', () => {
    expect(getTypeAheadTarget(names, 0, 'x')).toBeUndefined();
    expect(getTypeAheadTarget(names, 0, 'bz')).toBeUndefined();
    expect(getTypeAheadTarget([], -1, 'a')).toBeUndefined();
  });

  it('does not match an item without a name', () => {
    expect(getTypeAheadTarget(['', 'one', 'two'], -1, 'o')).toBe(1);
    expect(getTypeAheadTarget(['', 'one', 'two'], 2, 'o')).toBe(1);
  });
});
