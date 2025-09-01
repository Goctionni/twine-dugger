import { ObjectValue, ParsedPassageData, Path, Value } from '@/shared/shared-types';
import { isPrimitive } from '@/shared/type-helpers';

export function findPassageMatches(
  data: ParsedPassageData[],
  rawQuery: string,
): ParsedPassageData[] {
  const query = rawQuery.toLowerCase();
  const results: ParsedPassageData[] = [];
  // search name
  for (const passage of data) {
    if (passage.name.toLocaleLowerCase().includes(query)) results.push(passage);
  }
  // search tags
  for (const passage of data) {
    if (results.includes(passage)) continue;
    if (passage.tags?.some((tag) => tag.toLocaleLowerCase().includes(query))) {
      results.push(passage);
    }
  }
  // search content
  for (const passage of data) {
    if (results.includes(passage)) continue;
    if (passage.content.toLocaleLowerCase().includes(query)) results.push(passage);
  }
  return results;
}

export function findStateMatches(data: ObjectValue, rawQuery: string): Path[] {
  const fullMatches: Path[] = [];
  const partialMatches: Path[] = [];

  const query = rawQuery.toLowerCase();
  const qNum = (() => {
    const n = Number(rawQuery.trim());
    return Number.isFinite(n) ? n : undefined;
  })();

  const seen = new WeakSet<object>();

  function visit(val: Value, path: Path) {
    if (val && typeof val === 'object') {
      if (seen.has(val as object)) return;
      seen.add(val as object);

      if (Array.isArray(val)) {
        val.forEach((v, i) => {
          checkValue(v, i, path);
          visit(v, [...path, i]);
        });
        return;
      }

      if (val instanceof Map) {
        for (const [k, v] of val.entries()) {
          checkKey(`${k}`, path);
          checkValue(v, k, path);
          visit(v, [...path, k]);
        }
        return;
      }

      if (val instanceof Set) {
        let i = 0;
        for (const v of val) {
          checkValue(v, i, path);
          visit(v, [...path, i]);
          i++;
        }
        return;
      }

      const obj = val as { [k: string]: Value };
      for (const k of Object.keys(obj)) {
        checkKey(k, path);
        checkValue(obj[k], k, path);
        visit(obj[k], [...path, k]);
      }
    }
  }

  function checkKey(key: string, path: Path) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === query) {
      fullMatches.push([...path, key]);
    } else if (lowerKey.includes(query)) {
      partialMatches.push([...path, key]);
    }
  }

  function checkValue(v: Value, key: string | number, path: Path) {
    if (!isPrimitive(v)) return;

    if (typeof v === 'string') {
      const lowerVal = v.toLowerCase();
      if (lowerVal === query) {
        fullMatches.push([...path, key]);
      } else if (lowerVal.includes(query)) {
        partialMatches.push([...path, key]);
      }
    } else if (typeof v === 'number' && qNum !== undefined) {
      if (v === qNum) {
        fullMatches.push([...path, key]);
      } else if (String(v).includes(String(qNum))) {
        partialMatches.push([...path, key]);
      }
    }
  }

  visit(data, []);
  return dedupe([...fullMatches, ...partialMatches]);
}

function dedupe(paths: Path[]): Path[] {
  const seen = new Set<string>();
  const res: Path[] = [];
  for (const p of paths) {
    const key = JSON.stringify(p);
    if (!seen.has(key)) {
      seen.add(key);
      res.push(p);
    }
  }
  return res;
}
