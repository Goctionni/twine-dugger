import type { Settings } from '@/devtools-panel/store/store-types';

export type HighlightingLimit = Settings['editor.disableHighlighting'];

/**
 * Highlighting works through the whole text on every change: about 250 ms for 14 000 characters,
 * and seconds for a few hundred thousand. From these lengths on, a passage is first shown without it.
 * The order is the one the setting is shown in.
 */
export const highlightingLimits: Array<{
  value: HighlightingLimit;
  label: string;
  length: number;
}> = [
  { value: 'never', label: 'Never', length: Infinity },
  { value: 'very-large', label: 'Very large passages', length: 25_000 },
  { value: 'large', label: 'Large passages', length: 10_000 },
  { value: 'normal', label: 'Normal passages', length: 2_000 },
  { value: 'always', label: 'Always', length: 0 },
];

export const getHighlightingLength = (limit: HighlightingLimit) =>
  highlightingLimits.find(({ value }) => value === limit)!.length;

/** How the setting is shown: the name, and from what length on it applies */
export const describeLimit = ({ label, length }: (typeof highlightingLimits)[number]) =>
  Number.isFinite(length) && length > 0 ? `${label} (>=${length / 1000}k)` : label;
