import { getJsonType, SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type {
  JSONSafeObject,
  ParsedPassageData,
  Path,
  SearchResultState,
} from '@/shared/shared-types';

export type FindResult<T> = [Promise<T[]>, (reason?: string) => void];

// --- Not blocking the page --------------------------------------------------------------------

/** How long searching may keep the main thread before the browser gets to handle input again */
const SLICE_MS = 8;

/** Tells a long loop when to pause: cheap to ask, only reads the clock every `checkEvery` calls */
function createSlicer(signal: AbortSignal, checkEvery: number) {
  let sliceStart = performance.now();
  let calls = 0;
  return {
    /** True once the time budget is used up, or the search was aborted */
    due: () =>
      signal.aborted || (++calls % checkEvery === 0 && performance.now() - sliceStart > SLICE_MS),
    /** Lets the browser catch up. Resolves to false when the search was aborted meanwhile. */
    async yield() {
      await scheduler.yield();
      sliceStart = performance.now();
      return !signal.aborted;
    },
  };
}

/** Starts as its own task, so the caller isn't held up by the first slice of work */
function runSearch<T>(work: (signal: AbortSignal) => Promise<T[]>): FindResult<T> {
  const abortController = new AbortController();
  const promise = scheduler.postTask(() => work(abortController.signal), {
    signal: abortController.signal,
  });
  return [promise, (reason?: string) => abortController.abort(reason)];
}

// --- Passages -----------------------------------------------------------------------------------

interface LoweredPassage {
  name: string;
  tags: string[];
  content: string;
}

// Lowercasing the text of every passage on every search is most of what searching them costs. The
// passage objects are replaced when the passages are reloaded, which drops what is cached here.
const lowered = new WeakMap<ParsedPassageData, LoweredPassage>();

function getLowered(passage: ParsedPassageData) {
  let entry = lowered.get(passage);
  if (!entry) {
    entry = {
      name: passage.name.toLowerCase(),
      tags: passage.tags?.map((tag) => tag.toLowerCase()) ?? [],
      content: passage.content.toLowerCase(),
    };
    lowered.set(passage, entry);
  }
  return entry;
}

function passageMatches(passage: ParsedPassageData, query: string) {
  const { name, tags, content } = getLowered(passage);
  return name.includes(query) || tags.some((tag) => tag.includes(query)) || content.includes(query);
}

export function findPassageMatches(
  data: ParsedPassageData[],
  rawQuery: string,
): FindResult<ParsedPassageData> {
  const query = rawQuery.toLowerCase();

  return runSearch(async (signal) => {
    const results: ParsedPassageData[] = [];
    // Passages can be large, so the clock is checked often
    const slicer = createSlicer(signal, 8);

    for (const passage of data) {
      if (passageMatches(passage, query)) results.push(passage);
      if (slicer.due() && !(await slicer.yield())) return [];
    }
    return results;
  });
}

/** Whether the results of `previousQuery` contain everything that `query` matches */
export function canNarrowPassages(previousQuery: string, query: string) {
  return query.toLowerCase().includes(previousQuery.toLowerCase());
}

export function narrowPassageMatches(previous: ParsedPassageData[], rawQuery: string) {
  const query = rawQuery.toLowerCase();
  return previous.filter((passage) => passageMatches(passage, query));
}

// --- State --------------------------------------------------------------------------------------

interface Query {
  text: string;
  /** What the query is as a number, for matching numbers in the state */
  number: number | undefined;
}

function parseQuery(rawQuery: string): Query {
  const number = Number(rawQuery.trim());
  return { text: rawQuery.toLowerCase(), number: Number.isFinite(number) ? number : undefined };
}

const NONE = 0;
const PARTIAL = 1;
const FULL = 2;
type MatchKind = typeof NONE | typeof PARTIAL | typeof FULL;

function valueMatch(value: unknown, { text, number }: Query): MatchKind {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === text) return FULL;
    return lower.includes(text) ? PARTIAL : NONE;
  }
  if (typeof value === 'number' && number !== undefined) {
    if (value === number) return FULL;
    return String(value).includes(String(number)) ? PARTIAL : NONE;
  }
  if (typeof value === 'boolean') {
    return (text === 'true' && value) || (text === 'false' && !value) ? FULL : NONE;
  }
  return NONE;
}

/** `key` is the property name for values of an object, and undefined for items of an array */
function match(key: string | undefined, value: unknown, query: Query): MatchKind {
  let kind: MatchKind = NONE;
  if (key !== undefined) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === query.text) return FULL;
    if (lowerKey.includes(query.text)) kind = PARTIAL;
  }
  return Math.max(kind, valueMatch(value, query)) as MatchKind;
}

/** Where a value was found: paths are only put together for the values that match */
interface PathNode {
  key: string | number;
  parent: PathNode | null;
}

function pathOf(node: PathNode): Path {
  const path: Path = [];
  for (let current: PathNode | null = node; current; current = current.parent) {
    path.push(current.key);
  }
  return path.reverse();
}

export function findStateMatches(
  data: JSONSafeObject,
  rawQuery: string,
): FindResult<SearchResultState> {
  const query = parseQuery(rawQuery);

  return runSearch(async (signal) => {
    const fullMatches: SearchResultState[] = [];
    const partialMatches: SearchResultState[] = [];
    const slicer = createSlicer(signal, 128);

    // Depth first, without recursion: what a Set or Map stands for is skipped or unwrapped here
    const stack: Array<[value: unknown, node: PathNode | null]> = [[data, null]];
    while (stack.length) {
      if (slicer.due() && !(await slicer.yield())) return [];

      const [value, node] = stack.pop()!;
      if (!value || typeof value !== 'object') continue;

      // The source of a function or the parts of a date aren't worth searching
      const type = getJsonType(value);
      if (type === 'function' || type === 'date') continue;

      const children: Array<[unknown, PathNode]> = [];
      const visit = (key: string | number, child: unknown, isProperty: boolean) => {
        const childNode = { key, parent: node };
        const kind = match(isProperty ? String(key) : undefined, child, query);
        if (kind) {
          (kind === FULL ? fullMatches : partialMatches).push({
            path: pathOf(childNode),
            value: child as SearchResultState['value'],
          });
        }
        if (child && typeof child === 'object') children.push([child, childNode]);
      };

      if (Array.isArray(value)) {
        // The first item of a Set's array is its marker, not one of its items
        for (let i = value[0] === SET_MARKER ? 1 : 0; i < value.length; i++)
          visit(i, value[i], false);
      } else {
        for (const key of Object.keys(value)) {
          if (key !== TYPE_KEY) visit(key, (value as Record<string, unknown>)[key], true);
        }
      }
      // Reversed, so that what is found first in the state is found first in the results
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]!);
    }

    return [...fullMatches, ...partialMatches];
  });
}

/**
 * Whether the results of `previousQuery` contain everything that `query` matches, when the state
 * is the same. Longer queries match less, with two exceptions: only the whole word "true" (or
 * "false") matches a boolean, and numbers only match a query that reads as a number.
 */
export function canNarrowState(previousQuery: string, rawQuery: string) {
  const previous = parseQuery(previousQuery);
  const query = parseQuery(rawQuery);

  if (!query.text.includes(previous.text)) return false;
  if (query.text === 'true' || query.text === 'false') return false;
  if (query.number === undefined) return true;
  return previous.number !== undefined && String(query.number).includes(String(previous.number));
}

/** Filters the results of an earlier search that `canNarrowState` says contain all matches */
export function narrowStateMatches(previous: SearchResultState[], rawQuery: string) {
  const query = parseQuery(rawQuery);
  const full: SearchResultState[] = [];
  const partial: SearchResultState[] = [];

  for (const result of previous) {
    const key = result.path.at(-1);
    const kind = match(typeof key === 'string' ? key : undefined, result.value, query);
    if (kind) (kind === FULL ? full : partial).push(result);
  }
  return [...full, ...partial];
}
