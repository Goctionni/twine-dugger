import { expect, it } from 'vite-plus/test';

import { countCollapsed } from './count-collapsed';

it('collapses nothing while the columns fit at their minimum width', () => {
  // The scenarios of the concept, 1100 px wide: 1100 / 345+755 / 345+345+410 / 4 x 275
  expect([1, 2, 3, 4].map((columns) => countCollapsed(columns, 1100))).toEqual([0, 0, 0, 0]);
  expect(countCollapsed(4, 920)).toBe(0);
});

it('collapses from the left as few as it takes: 5 columns need 1150 px, a strip saves 200', () => {
  expect(countCollapsed(5, 1100)).toBe(1);
  expect(countCollapsed(5, 950)).toBe(1);
  expect(countCollapsed(5, 949)).toBe(2);
  expect(countCollapsed(5, 380)).toBe(4);
});

it('never collapses the last column, however narrow it gets', () => {
  expect(countCollapsed(1, 100)).toBe(0);
  expect(countCollapsed(3, 50)).toBe(2);
});

it('collapses nothing for a pane that was not measured yet', () => {
  expect(countCollapsed(5, 0)).toBe(0);
});
