import type { SearchQuery } from './types';

/** The same for the same search: what depends on it does not have to run again */
export const queryKey = ({ searchText, options }: SearchQuery) =>
  `${options.caseSensitive ? 'c' : '-'}${options.wholeWord ? 'w' : '-'}${options.regex ? 'r' : '-'}:${searchText}`;

/**
 * Whether everything that matches `next` also matches `prev`, so that searching what matched `prev`
 * is enough. That only holds for plain text: a whole word or a regex that matches "aa" doesn't have
 * to match "a".
 */
export function canNarrow(prev: SearchQuery, next: SearchQuery): boolean {
  if (prev.options.regex || next.options.regex) return false;
  if (prev.options.wholeWord || next.options.wholeWord) return false;
  if (prev.options.caseSensitive !== next.options.caseSensitive) return false;
  return next.options.caseSensitive
    ? next.searchText.includes(prev.searchText)
    : next.searchText.toLowerCase().includes(prev.searchText.toLowerCase());
}
