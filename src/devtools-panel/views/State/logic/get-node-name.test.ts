import { expect, it } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeContainer } from '@/shared/shared-types';

import { getNodeName } from './get-node-name';

const state = {
  gold: 1,
  items: ['sword', 'shield'],
  flags: [SET_MARKER, 'a', 'b'],
  scores: { [TYPE_KEY]: 'Map', ada: 3 },
  group: { inner: { x: 1 } },
} as unknown as JSONSafeContainer;

it('calls the state State', () => {
  expect(getNodeName(state, [])).toBe('State');
});

it('names a value by its key', () => {
  expect(getNodeName(state, ['gold'])).toBe('gold');
  expect(getNodeName(state, ['group', 'inner'])).toBe('inner');
  expect(getNodeName(state, ['scores', 'ada'])).toBe('ada');
});

it('names an item of an array by its position, and an item of a set without the marker', () => {
  expect(getNodeName(state, ['items', 1])).toBe('1');
  expect(getNodeName(state, ['flags', 1])).toBe('0');
});

it('still gives the key of a value that is not in the state', () => {
  expect(getNodeName(state, ['gone'])).toBe('gone');
  expect(getNodeName(state, ['gone', 'deeper'])).toBe('deeper');
});
