import { expect, it } from 'vite-plus/test';

import { SET_MARKER } from '@/shared/json-safe';

import { getLockStatus, hasLockInside, isInsideSet } from './edit-status';

it('tells a value that is locked from one that a parent locks', () => {
  const locked = [['stats'], ['inv', 0]];
  expect(getLockStatus(['stats'], locked)).toBe('locked');
  expect(getLockStatus(['stats', 'str'], locked)).toBe('ancestor-lock');
  expect(getLockStatus(['inv', 0, 'name'], locked)).toBe('ancestor-lock');
  expect(getLockStatus(['inv', 1], locked)).toBe('unlocked');
  expect(getLockStatus(['hp'], [])).toBe('unlocked');
});

it('finds what is in a set, at any depth', () => {
  const state = { tags: [SET_MARKER, 'a', { n: 1 }], list: [1, { n: 2 }], hp: 3 };
  expect(isInsideSet(state, ['tags', 1])).toBe(true);
  expect(isInsideSet(state, ['tags', 2, 'n'])).toBe(true);
  expect(isInsideSet(state, ['tags'])).toBe(false);
  expect(isInsideSet(state, ['list', 1, 'n'])).toBe(false);
  expect(isInsideSet(state, ['hp'])).toBe(false);
});

it('finds a lock inside a value, not on the value itself or beside it', () => {
  const locked = [['stats', 'str'], ['inv']];
  expect(hasLockInside(['stats'], locked)).toBe(true);
  expect(hasLockInside([], locked)).toBe(true);
  expect(hasLockInside(['stats', 'str'], locked)).toBe(false);
  expect(hasLockInside(['inv'], locked)).toBe(false);
  expect(hasLockInside(['other'], locked)).toBe(false);
});
