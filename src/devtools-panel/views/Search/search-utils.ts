import {
  ObjectValue,
  ParsedPassageData,
  Path,
  SearchResultState,
  Value,
} from '@/shared/shared-types';
import { isPrimitive } from '@/shared/type-helpers';

type FindResult<T> = [Promise<T[]>, () => void];

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

  return [promise, () => abortController.abort()];
}

export function findStateMatches(
  data: ObjectValue,
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

    async function visit(val: Value, path: Path) {
      if (!val || typeof val !== 'object' || signal.aborted) return;
      if (seen.has(val as object)) return;
      seen.add(val as object);

      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          checkValue(val[i], i, path);
          await visit(val[i], [...path, i]);
        }
      } else if (val instanceof Map) {
        for (const [k, v] of val.entries()) {
          checkKey(`${k}`, path, v);
          checkValue(v, k, path);
          visit(v, [...path, k]);
        }
      } else if (val instanceof Set) {
        let i = 0;
        for (const v of val) {
          checkValue(v, i, path);
          visit(v, [...path, i]);
          i++;
        }
      } else {
        const obj = val as { [k: string]: Value };
        for (const k of Object.keys(obj)) {
          checkKey(k, path, obj[k]);
          checkValue(obj[k], k, path);
          visit(obj[k], [...path, k]);
        }
      }
      if (signal.aborted) return;
      await scheduler.yield();
    }

    function checkKey(key: string, path: Path, value: Value) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === query) {
        fullMatches.push({ path: [...path, key], value });
      } else if (lowerKey.includes(query)) {
        partialMatches.push({ path: [...path, key], value });
      }
    }

    function checkValue(v: Value, key: string | number, path: Path) {
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
