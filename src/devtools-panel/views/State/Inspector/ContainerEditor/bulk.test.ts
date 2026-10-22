import { expect, it } from 'vite-plus/test';

import type { ValueType } from '@/shared/shared-types';

import { getBulkKind, getBulkLockState, getKeysOfType, sortForDeletion } from './bulk';

it('finds what the selected values have in common', () => {
  expect(getBulkKind([])).toBe('none');
  expect(getBulkKind(['number', 'number'])).toBe('number');
  expect(getBulkKind(['string'])).toBe('string');
  expect(getBulkKind(['boolean', 'boolean'])).toBe('boolean');
  expect(getBulkKind(['number', 'string'])).toBe('mixed');
  expect(getBulkKind(['null', 'null'])).toBe('other');
});

it('picks the keys of one type', () => {
  const types: Record<string, ValueType> = { a: 'number', b: 'string', c: 'number' };
  expect(getKeysOfType(['a', 'b', 'c'], (key) => types[key]!, 'number')).toEqual(['a', 'c']);
});

it('says whether none, all or some are locked', () => {
  expect(getBulkLockState(['unlocked', 'unlocked'])).toBe('unlocked');
  expect(getBulkLockState(['locked', 'locked'])).toBe('locked');
  expect(getBulkLockState(['locked', 'unlocked'])).toBe('some-locked');
  expect(getBulkLockState([])).toBe('unlocked');
});

it('deletes array items from the last one', () => {
  const paths = [
    ['a', 1],
    ['a', 4],
    ['a', 2],
  ];
  expect(sortForDeletion(paths)).toEqual([
    ['a', 4],
    ['a', 2],
    ['a', 1],
  ]);
  expect(sortForDeletion([['x'], ['y']])).toEqual([['x'], ['y']]);
});
