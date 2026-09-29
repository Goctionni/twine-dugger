import { getJsonType, SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type {
  JSONSafeObject,
  JSONSafeValue,
  ParsedPassageData,
  Path,
  SearchResultState,
} from '@/shared/shared-types';
import { isPrimitive } from '@/shared/type-helpers';

type FindResult<T> = [Promise<T[]>, (reason?: string) => void];

export function findPassageMatches(
  data: ParsedPassageData[],
  rawQuery: string,
): FindResult<ParsedPassageData> {
  const query = rawQuery.toLowerCase();
  const results: ParsedPassageData[] = [];

  const abortController = new AbortController();
  const signal = abortController.signal;

  const promise = scheduler.postTask(
    async () => {
      for (const passage of data) {
        if (passage.name.toLocaleLowerCase().includes(query)) results.push(passage);
        else if (passage.tags?.some((tag) => tag.toLocaleLowerCase().includes(query))) {
          results.push(passage);
        } else if (passage.content.toLocaleLowerCase().includes(query)) {
          results.push(passage);
        }
        if (signal.aborted) return [];
        await scheduler.yield();
      }
      return results;
    },
    { signal: abortController.signal },
  );

  return [promise, (reason?: string) => abortController.abort(reason)];
}

export function findStateMatches(
  data: JSONSafeObject,
  rawQuery: string,
): FindResult<SearchResultState> {
  const fullMatches: SearchResultState[] = [];
  const partialMatches: SearchResultState[] = [];

  const abortController = new AbortController();
  const signal = abortController.signal;

  const promise = scheduler.postTask(async () => {
    const query = rawQuery.toLowerCase();
    const qNum = (() => {
      const n = Number(rawQuery.trim());
      return Number.isFinite(n) ? n : undefined;
    })();

    const seen = new WeakSet<object>();

    async function visit(val: JSONSafeValue, path: Path) {
      if (!val || typeof val !== 'object' || signal.aborted) return;
      if (seen.has(val)) return;
      seen.add(val);

      const type = getJsonType(val);
      // The source of a function or the parts of a date aren't worth searching
      if (type === 'function' || type === 'date') return;

      if (Array.isArray(val)) {
        // The first item of a Set's array is its marker, not one of its items
        for (let i = val[0] === SET_MARKER ? 1 : 0; i < val.length; i++) {
          checkValue(val[i]!, i, path);
          await visit(val[i]!, [...path, i]);
        }
      } else {
        const obj = val as JSONSafeObject;
        for (const k of Object.keys(obj)) {
          if (k === TYPE_KEY) continue;
          checkKey(k, path, obj[k]!);
          checkValue(obj[k]!, k, path);
          visit(obj[k]!, [...path, k]);
        }
      }
      if (signal.aborted) return;
      await scheduler.yield();
    }

    function checkKey(key: string, path: Path, value: JSONSafeValue) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === query) {
        fullMatches.push({ path: [...path, key], value });
      } else if (lowerKey.includes(query)) {
        partialMatches.push({ path: [...path, key], value });
      }
    }

    function checkValue(v: JSONSafeValue, key: string | number, path: Path) {
      if (!isPrimitive(v)) return;

      if (typeof v === 'string') {
        const lowerVal = v.toLowerCase();
        if (lowerVal === query) {
          fullMatches.push({ path: [...path, key], value: v });
        } else if (lowerVal.includes(query)) {
          partialMatches.push({ path: [...path, key], value: v });
        }
      } else if (typeof v === 'number' && qNum !== undefined) {
        if (v === qNum) {
          fullMatches.push({ path: [...path, key], value: v });
        } else if (String(v).includes(String(qNum))) {
          partialMatches.push({ path: [...path, key], value: v });
        }
      } else if (typeof v === 'boolean') {
        if ((query === 'true' && v) || (query === 'false' && !v)) {
          fullMatches.push({ path: [...path, key], value: v });
        }
      }
    }

    await visit(data, []);
    if (signal.aborted) return [];
    return dedupe([...fullMatches, ...partialMatches]);
  });

  return [promise, () => abortController.abort()];
}

function dedupe(results: SearchResultState[]): SearchResultState[] {
  const seen = new Set<string>();
  const dedupedResult: SearchResultState[] = [];
  for (const result of results) {
    const key = JSON.stringify(result.path);
    if (!seen.has(key)) {
      seen.add(key);
      dedupedResult.push(result);
    }
  }
  return dedupedResult;
}
