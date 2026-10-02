import { getJsonType, SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type {
  JSONSafeObject,
  ParsedPassageData,
  Path,
  SearchResultState,
} from '@/shared/shared-types';

export type FindResult<T> = [Promise<T[]>, (reason?: string) => void];

const SLICE_MS = 8;

/**
 * Runs `step` until it says there's nothing left to do, giving way to the browser every so often.
 * Resolves to false when aborted. `step` is cheap, so the clock is only read every few steps.
 */
async function runInSlices(signal: AbortSignal, step: () => boolean) {
  for (let more = true; more;) {
    const sliceEnd = performance.now() + SLICE_MS;
    do {
      for (let steps = 0; steps < 64 && more; steps++) more = step();
    } while (more && performance.now() < sliceEnd);

    if (more) await scheduler.yield();
    if (signal.aborted) return false;
  }
  return true;
}

function runSearch<T>(search: (signal: AbortSignal) => Promise<T[]>): FindResult<T> {
  const abortController = new AbortController();
  const promise = scheduler.postTask(() => search(abortController.signal), {
    signal: abortController.signal,
  });
  return [promise, (reason?: string) => abortController.abort(reason)];
}

/**
 * What is searched for. A case-insensitive regex finds it without making a lowercase copy of every
 * text that is looked at, which is faster than `toLowerCase().includes()` and doesn't allocate.
 */
function createQuery(rawQuery: string) {
  const regex = new RegExp(rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const number = Number(rawQuery.trim());
  return {
    regex,
    length: rawQuery.length,
    lowerCase: rawQuery.toLowerCase(),
    number: Number.isFinite(number) ? number : undefined,
  };
}
type Query = ReturnType<typeof createQuery>;

const NONE = 0;
const PARTIAL = 1;
const FULL = 2;
type MatchKind = typeof NONE | typeof PARTIAL | typeof FULL;

function matchText(text: string, { regex, length }: Query): MatchKind {
  if (!regex.test(text)) return NONE;
  return text.length === length ? FULL : PARTIAL;
}

function matchValue(value: unknown, query: Query): MatchKind {
  if (typeof value === 'string') return matchText(value, query);
  if (typeof value === 'number' && query.number !== undefined) {
    if (value === query.number) return FULL;
    return String(value).includes(String(query.number)) ? PARTIAL : NONE;
  }
  if (typeof value === 'boolean') {
    return query.lowerCase === String(value) ? FULL : NONE;
  }
  return NONE;
}

export function findPassageMatches(
  data: ParsedPassageData[],
  rawQuery: string,
): FindResult<ParsedPassageData> {
  const { regex } = createQuery(rawQuery);
  const matches = (passage: ParsedPassageData) =>
    regex.test(passage.name) ||
    !!passage.tags?.some((tag) => regex.test(tag)) ||
    regex.test(passage.content);

  return runSearch(async (signal) => {
    const results: ParsedPassageData[] = [];
    let index = 0;
    const finished = await runInSlices(signal, () => {
      const passage = data[index++];
      if (passage && matches(passage)) results.push(passage);
      return index < data.length;
    });
    return finished ? results : [];
  });
}

export function findStateMatches(
  data: JSONSafeObject,
  rawQuery: string,
): FindResult<SearchResultState> {
  const query = createQuery(rawQuery);

  return runSearch(async (signal) => {
    const full: SearchResultState[] = [];
    const partial: SearchResultState[] = [];
    const found = (kind: MatchKind, path: Path, value: unknown) => {
      if (kind !== NONE)
        (kind === FULL ? full : partial).push({ path, value } as SearchResultState);
    };

    const stack: Array<[value: unknown, path: Path]> = [[data, []]];
    const finished = await runInSlices(signal, () => {
      const [value, path] = stack.pop()!;
      if (!value || typeof value !== 'object') return stack.length > 0;

      const type = getJsonType(value);
      if (type === 'function' || type === 'date') return stack.length > 0;

      const children: Array<[unknown, Path]> = [];
      const visit = (key: string | number, child: unknown, matchKey: boolean) => {
        const childPath = [...path, key];
        const valueMatch = matchValue(child, query);
        const keyMatch = matchKey ? matchText(String(key), query) : NONE;
        found(Math.max(keyMatch, valueMatch) as MatchKind, childPath, child);
        if (child && typeof child === 'object') children.push([child, childPath]);
      };

      if (Array.isArray(value)) {
        for (let i = value[0] === SET_MARKER ? 1 : 0; i < value.length; i++) {
          visit(i, value[i], false);
        }
      } else {
        for (const [key, child] of Object.entries(value)) {
          if (key !== TYPE_KEY) visit(key, child, true);
        }
      }

      // Reversed, so that what is found first in the state is found first in the results
      stack.push(...children.reverse());
      return stack.length > 0;
    });

    return finished ? [...full, ...partial] : [];
  });
}
