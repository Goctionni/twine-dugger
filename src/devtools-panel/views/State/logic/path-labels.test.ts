import { expect, it } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';

import { getPathLabels } from './path-labels';

it('names the items of a set by position, not by where they are after the marker', () => {
  const state = {
    tags: [SET_MARKER, 'x', 'y'],
    scores: { [TYPE_KEY]: 'Map', ann: [1, 2] },
  };
  expect(getPathLabels(state, ['tags', 2])).toEqual(['tags', '1']);
  expect(getPathLabels(state, ['scores', 'ann', 1])).toEqual(['scores', 'ann', '1']);
});
