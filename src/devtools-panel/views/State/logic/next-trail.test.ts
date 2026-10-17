import { expect, it } from 'vite-plus/test';

import { nextTrail } from './next-trail';

const trail = ['character', 'stats', 'fitness', 'running'];

it('keeps the trail while the path is the start of it', () => {
  expect(nextTrail(trail, ['character'])).toBe(trail);
  expect(nextTrail(trail, ['character', 'stats'])).toBe(trail);
  expect(nextTrail(trail, trail)).toBe(trail);
  expect(nextTrail(trail, [])).toBe(trail);
});

it('is replaced by a path that goes deeper or somewhere else', () => {
  const deeper = [...trail, 'rep'];
  expect(nextTrail(trail, deeper)).toBe(deeper);
  const other = ['character', 'skills'];
  expect(nextTrail(trail, other)).toBe(other);
});
