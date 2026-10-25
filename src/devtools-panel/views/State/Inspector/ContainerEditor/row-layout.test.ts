import { expect, it } from 'vite-plus/test';

import { getNameColumn } from './row-layout';

it('gives text names a share of the row', () => {
  expect(getNameColumn(['hp', 'gold'])).toBe('40%');
  expect(getNameColumn([])).toBe('40%');
});

it('does the same when only some of the names are numbers', () => {
  expect(getNameColumn(['1', 'gold'])).toBe('40%');
});

it('sizes the column of numbers on the highest', () => {
  const narrow = getNameColumn([0, 1, 2]);
  const wider = getNameColumn(Array.from({ length: 101 }, (_, index) => index));
  expect(narrow).toMatch(/rem$/);
  expect(parseFloat(wider)).toBeGreaterThan(parseFloat(narrow));
  // A number as a key of an object is text, and counts the same
  expect(getNameColumn(['0', '1', '2'])).toBe(narrow);
});
