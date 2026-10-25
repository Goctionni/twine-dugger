import { expect, it } from 'vite-plus/test';

import { NAN_MARKER, NEGATIVE_INFINITY_MARKER, UNDEFINED_MARKER } from '@/shared/json-safe';

import { getPreview, toPreviewRanges } from './preview';

it('shows NaN, the infinities and undefined as what they stand for', () => {
  expect(getPreview(NAN_MARKER, 'NaN')).toBe('NaN');
  expect(getPreview(NEGATIVE_INFINITY_MARKER, 'infinity')).toBe('-Infinity');
  expect(getPreview(UNDEFINED_MARKER, 'undefined')).toBe('undefined');
  expect(getPreview('a', 'string')).toBe('"a"');
});

it('moves ranges in a string to where they are in the preview', () => {
  const preview = (text: string, ranges: Array<[number, number]>) =>
    toPreviewRanges(text, ranges).map(([start, end]) =>
      getPreview(text, 'string').slice(start, end),
    );

  expect(preview('a gold bag', [[2, 6]])).toEqual(['gold']);
  expect(
    preview('say "gold"\nthen gold', [
      [5, 9],
      [16, 20],
    ]),
  ).toEqual(['gold', 'gold']);
  expect(preview('c:\\gold\ttab', [[3, 7]])).toEqual(['gold']);
  expect(preview('\u0001gold\u0002', [[1, 5]])).toEqual(['gold']);
  expect(preview('🎲 gold', [[3, 7]])).toEqual(['gold']);
  expect(preview('\n\n\n', [[0, 3]])).toEqual([String.raw`\n\n\n`]);
});
