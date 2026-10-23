import { describe, expect, it } from 'vite-plus/test';

import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { getTreeKeyAction } from './get-tree-key-action';
import type { TreeRow } from './get-tree-rows';

const row = (path: Path): TreeRow => ({ id: pathKey(path), path, level: path.length });

// a (open) > x, y (closed, with children); b; c (closed, with children)
const rows = [row(['a']), row(['a', 'x']), row(['a', 'y']), row(['b']), row(['c'])];
const hasChildren = (candidate: TreeRow) => ['a', 'c', 'y'].includes(String(candidate.path.at(-1)));
const act = (key: Parameters<typeof getTreeKeyAction>[0], path: Path) =>
  getTreeKeyAction(key, path, rows, hasChildren);

describe('getTreeKeyAction', () => {
  it('goes down and up through the rows as they are shown', () => {
    expect(act('ArrowDown', ['a'])).toEqual({ type: 'select', path: ['a', 'x'] });
    expect(act('ArrowDown', ['a', 'y'])).toEqual({ type: 'select', path: ['b'] });
    expect(act('ArrowUp', ['b'])).toEqual({ type: 'select', path: ['a', 'y'] });
    expect(act('ArrowUp', ['a'])).toBeUndefined();
    expect(act('ArrowDown', ['c'])).toBeUndefined();
  });

  it('goes to the first row from nothing, and does nothing else there', () => {
    expect(act('ArrowDown', [])).toEqual({ type: 'select', path: ['a'] });
    expect(act('ArrowUp', [])).toBeUndefined();
    expect(act('ArrowLeft', [])).toBeUndefined();
    expect(act('ArrowRight', [])).toBeUndefined();
  });

  it('closes an open container with left, and goes to what holds it otherwise', () => {
    expect(act('ArrowLeft', ['a'])).toEqual({ type: 'collapse', id: pathKey(['a']) });
    expect(act('ArrowLeft', ['a', 'x'])).toEqual({ type: 'select', path: ['a'] });
    expect(act('ArrowLeft', ['a', 'y'])).toEqual({ type: 'select', path: ['a'] });
    // A value at the top: what holds it is the state itself
    expect(act('ArrowLeft', ['b'])).toEqual({ type: 'select', path: [] });
  });

  it('opens a closed container with right, and goes into an open one', () => {
    expect(act('ArrowRight', ['c'])).toEqual({ type: 'expand', id: pathKey(['c']) });
    expect(act('ArrowRight', ['a', 'y'])).toEqual({ type: 'expand', id: pathKey(['a', 'y']) });
    expect(act('ArrowRight', ['a'])).toEqual({ type: 'select', path: ['a', 'x'] });
    expect(act('ArrowRight', ['b'])).toBeUndefined();
  });
});
