import { expect, it } from 'vite-plus/test';

import { NAN_MARKER, NEGATIVE_INFINITY_MARKER, UNDEFINED_MARKER } from '@/shared/json-safe';

import { getPreview } from './preview';

it('shows NaN, the infinities and undefined as what they stand for', () => {
  expect(getPreview(NAN_MARKER, 'NaN')).toBe('NaN');
  expect(getPreview(NEGATIVE_INFINITY_MARKER, 'infinity')).toBe('-Infinity');
  expect(getPreview(UNDEFINED_MARKER, 'undefined')).toBe('undefined');
  expect(getPreview('a', 'string')).toBe('"a"');
});
