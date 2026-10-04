import type { Range, SearchOptions } from './types';

/** Ranges kept per field; matches beyond it are still counted by `count` */
export const MAX_RANGES = 50;

export interface CompiledQuery {
  readonly ok: true;
  readonly text: string;
  readonly options: SearchOptions;
  /** Identifies text + options; equal keys always give equal results */
  readonly key: string;
  /** Whether `text` has at least one (non-empty) match */
  test(text: string): boolean;
  /** The first match */
  first(text: string): Range | null;
  /** Up to `max` matches */
  ranges(text: string, max?: number): Range[];
  /** The number of matches */
  count(text: string): number;
}
export interface InvalidQuery {
  readonly ok: false;
  readonly error: string;
}

export const queryKey = (text: string, { caseSensitive, wholeWord, regex }: SearchOptions) =>
  `${caseSensitive ? 'c' : '-'}${wholeWord ? 'w' : '-'}${regex ? 'r' : '-'}:${text}`;

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turns the query into one regex: it finds a match without making a lowercase copy of every text
 * that is looked at, and gives positions for highlighting. Returns null for an empty query.
 */
export function compileQuery(
  text: string,
  options: SearchOptions,
): CompiledQuery | InvalidQuery | null {
  if (!text) return null;

  const body = options.regex ? text : escapeRegex(text);
  const source = options.wholeWord ? `(?<!\\w)(?:${body})(?!\\w)` : body;
  const flags = options.caseSensitive ? '' : 'i';

  let find: RegExp;
  let scan: RegExp;
  try {
    find = new RegExp(source, flags);
    scan = new RegExp(source, `${flags}g`);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  /** Calls `visit` for every non-empty match until it returns false */
  const eachMatch = (haystack: string, visit: (start: number, end: number) => boolean) => {
    scan.lastIndex = 0;
    for (let match = scan.exec(haystack); match; match = scan.exec(haystack)) {
      // A regex like `a*` also matches nothing at all; that is not something to show
      if (match[0].length === 0) scan.lastIndex++;
      else if (!visit(match.index, match.index + match[0].length)) break;
    }
  };

  const first = (haystack: string): Range | null => {
    let found = null as Range | null;
    eachMatch(haystack, (start, end) => ((found = [start, end]), false));
    return found;
  };

  return {
    ok: true,
    text,
    options,
    key: queryKey(text, options),
    // A literal query is never empty, so the cheaper test says the same as a search for matches
    test: options.regex
      ? (haystack) => first(haystack) !== null
      : (haystack) => find.test(haystack),
    first,
    ranges(haystack, max = MAX_RANGES) {
      const found: Range[] = [];
      eachMatch(haystack, (start, end) => (found.push([start, end]), found.length < max));
      return found;
    },
    count(haystack) {
      let count = 0;
      eachMatch(haystack, () => (count++, true));
      return count;
    },
  };
}

/**
 * Whether everything that matches `next` also matches `prev`, so that searching what matched `prev`
 * is enough. That only holds for plain text: a whole word or a regex that matches "aa" doesn't have
 * to match "a".
 */
export function canNarrow(prev: CompiledQuery, next: CompiledQuery): boolean {
  if (prev.options.regex || next.options.regex) return false;
  if (prev.options.wholeWord || next.options.wholeWord) return false;
  if (prev.options.caseSensitive !== next.options.caseSensitive) return false;
  return next.options.caseSensitive
    ? next.text.includes(prev.text)
    : next.text.toLowerCase().includes(prev.text.toLowerCase());
}
