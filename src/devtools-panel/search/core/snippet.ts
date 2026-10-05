import type { Range, Snippet } from './types';

/**
 * One line of `content` around `range`, for a row. Line breaks become spaces (one character each),
 * so the range keeps its length and only moves.
 */
export function snippetAround(
  content: string,
  [start, end]: Range,
  { before = 38, after = 80 } = {},
): Snippet {
  const from = Math.max(0, start - before);
  const to = Math.min(content.length, end + after);
  const lead = from > 0 ? '…' : '';
  const text =
    lead + content.slice(from, to).replace(/\s/g, ' ') + (to < content.length ? '…' : '');
  const offset = lead.length - from;
  return { text, ranges: [[start + offset, end + offset]] };
}
