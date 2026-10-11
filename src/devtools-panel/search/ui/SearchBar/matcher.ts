import type { Matcher, Range, SearchQuery } from '../../core/types';

export type MatcherResult = { ok: true; matcher: Matcher } | { ok: false; error: string };

/** Ranges kept per text; matches beyond it are still counted by `count` */
const MAX_RANGES = 50;

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turns a search into one regex: it finds a match without making a lowercase copy of every text
 * that is looked at, and gives positions for highlighting. `searchText` must not be empty: with
 * nothing to search for there is nothing to make.
 */
export function createMatcher(query: SearchQuery): MatcherResult {
  const { searchText, options } = query;
  const body = options.regex ? searchText : escapeRegex(searchText);
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
  const eachMatch = (text: string, visit: (start: number, end: number) => boolean) => {
    scan.lastIndex = 0;
    for (let match = scan.exec(text); match; match = scan.exec(text)) {
      // A regex like `a*` also matches nothing at all; that is not something to show
      if (match[0].length === 0) scan.lastIndex++;
      else if (!visit(match.index, match.index + match[0].length)) break;
    }
  };

  const first = (text: string): Range | null => {
    let found = null as Range | null;
    eachMatch(text, (start, end) => ((found = [start, end]), false));
    return found;
  };

  return {
    ok: true,
    matcher: {
      query,
      canNarrowFrom({ query: previous }) {
        if (previous.options.regex || options.regex) return false;
        if (previous.options.wholeWord || options.wholeWord) return false;
        if (previous.options.caseSensitive && !options.caseSensitive) return false;
        return previous.options.caseSensitive
          ? searchText.includes(previous.searchText)
          : searchText.toLowerCase().includes(previous.searchText.toLowerCase());
      },
      // A literal search is never empty, so the cheaper test says the same as a search for matches
      test: options.regex ? (text) => first(text) !== null : (text) => find.test(text),
      first,
      ranges(text, max = MAX_RANGES) {
        const found: Range[] = [];
        eachMatch(text, (start, end) => (found.push([start, end]), found.length < max));
        return found;
      },
      count(text) {
        let count = 0;
        eachMatch(text, () => (count++, true));
        return count;
      },
    },
  };
}
