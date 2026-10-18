import { describe, expect, it } from 'vite-plus/test';

import type { Path } from '@/shared/shared-types';

import { getKeyTarget } from './key-target';

const columns: Record<string, Array<string | number>> = {
  '': ['a', 'b', 'c'],
  'a': ['x', 'y'],
  'a.y': [0, 1, 2],
};
const getKeysAt = (path: Path) => columns[path.join('.')] ?? [];

describe('up and down', () => {
  it('go to the next and the previous key of the column, and stop at its ends', () => {
    expect(getKeyTarget('ArrowDown', ['b'], [], getKeysAt)).toEqual(['c']);
    expect(getKeyTarget('ArrowUp', ['b'], [], getKeysAt)).toEqual(['a']);
    expect(getKeyTarget('ArrowUp', ['a'], [], getKeysAt)).toBeUndefined();
    expect(getKeyTarget('ArrowDown', ['c'], [], getKeysAt)).toBeUndefined();
    expect(getKeyTarget('ArrowDown', ['a', 'x'], [], getKeysAt)).toEqual(['a', 'y']);
  });

  it('start at the first key of the root when nothing is selected', () => {
    expect(getKeyTarget('ArrowDown', [], [], getKeysAt)).toEqual(['a']);
    expect(getKeyTarget('ArrowUp', [], [], getKeysAt)).toBeUndefined();
  });

  it('go to the first key when the selected one is not in the column', () => {
    expect(getKeyTarget('ArrowDown', ['gone'], [], getKeysAt)).toEqual(['a']);
    expect(getKeyTarget('ArrowUp', ['gone'], [], getKeysAt)).toBeUndefined();
  });
});

describe('left', () => {
  it('goes to the container, and stays at the root', () => {
    expect(getKeyTarget('ArrowLeft', ['a', 'y'], [], getKeysAt)).toEqual(['a']);
    expect(getKeyTarget('ArrowLeft', ['a'], [], getKeysAt)).toEqual([]);
    expect(getKeyTarget('ArrowLeft', [], [], getKeysAt)).toBeUndefined();
  });
});

describe('right', () => {
  it('goes to the first key of the selected container', () => {
    expect(getKeyTarget('ArrowRight', ['a'], [], getKeysAt)).toEqual(['a', 'x']);
    expect(getKeyTarget('ArrowRight', [], [], getKeysAt)).toEqual(['a']);
  });

  it('goes the way of the trail when the trail passes through the selection', () => {
    expect(getKeyTarget('ArrowRight', ['a'], ['a', 'y', 2], getKeysAt)).toEqual(['a', 'y']);
    expect(getKeyTarget('ArrowRight', ['a', 'y'], ['a', 'y', 2], getKeysAt)).toEqual(['a', 'y', 2]);
  });

  it('ignores a trail that is somewhere else, or at a key that is not shown', () => {
    expect(getKeyTarget('ArrowRight', ['b'], ['a', 'y'], getKeysAt)).toBeUndefined();
    expect(getKeyTarget('ArrowRight', ['a'], ['a', 'gone'], getKeysAt)).toEqual(['a', 'x']);
  });

  it('does nothing for a value or an empty container', () => {
    expect(getKeyTarget('ArrowRight', ['a', 'x'], [], getKeysAt)).toBeUndefined();
  });
});
