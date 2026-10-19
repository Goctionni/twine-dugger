import { expect, it } from 'vite-plus/test';

import { changeBound } from './lock-range';

it('changes one bound and leaves the other', () => {
  expect(changeBound({ min: 0, max: 10 }, 'min', 3)).toEqual({ min: 3, max: 10 });
  expect(changeBound({ min: 0, max: 10 }, 'max', 7)).toEqual({ min: 0, max: 7 });
});

it('pushes the other bound along when the new one would cross it', () => {
  expect(changeBound({ min: 0, max: 10 }, 'min', 15)).toEqual({ min: 15, max: 15 });
  expect(changeBound({ min: 5, max: 10 }, 'max', 2)).toEqual({ min: 2, max: 2 });
});
