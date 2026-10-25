import { getMarkedValueText } from '@/shared/json-safe';
import type { ValueType } from '@/shared/shared-types';

/** What a row shows of a value that is not a container */
export function getPreview(value: unknown, type: ValueType): string {
  switch (type) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
    case 'boolean':
    case 'null':
      return String(value);
    case 'NaN':
    case 'infinity':
    case 'undefined':
      return getMarkedValueText(value) ?? type;
    default:
      return type;
  }
}

/**
 * Moves ranges in a string to where the text is in its preview: after the opening quote, and past
 * what JSON.stringify writes longer (a quote, a backslash, a line break, a control character).
 */
export function toPreviewRanges(
  text: string,
  ranges: ReadonlyArray<readonly [number, number]>,
): Array<readonly [number, number]> {
  // Nothing is escaped when the quoted text is just two characters longer
  if (JSON.stringify(text).length === text.length + 2)
    return ranges.map(([start, end]) => [start + 1, end + 1]);

  // Where each character of the text starts in the preview; only as far as the last range needs
  const lastEnd = Math.max(...ranges.map(([, end]) => end), 0);
  const startOf: number[] = [];
  let at = 1;
  let index = 0;
  for (const char of text) {
    if (index > lastEnd) break;
    for (let unit = 0; unit < char.length; unit++) startOf[index + unit] = at;
    at += JSON.stringify(char).length - 2;
    index += char.length;
  }
  startOf[index] = at;
  return ranges.map(([start, end]) => [startOf[start] ?? at, startOf[end] ?? at]);
}
