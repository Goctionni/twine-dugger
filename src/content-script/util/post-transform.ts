import {
  isNumberLike,
  NAN_MARKER,
  NEGATIVE_INFINITY_MARKER,
  POSITIVE_INFINITY_MARKER,
  SET_MARKER,
  TYPE_KEY,
  UNDEFINED_MARKER,
} from '@/shared/json-safe';
import type { JSONSafeDate, JSONSafeObject, JSONSafeValue } from '@/shared/shared-types';

export function posttransformValue(value: JSONSafeValue): unknown {
  if (value === NAN_MARKER) return Number.NaN;
  if (value === POSITIVE_INFINITY_MARKER) return Infinity;
  if (value === NEGATIVE_INFINITY_MARKER) return -Infinity;
  if (value === UNDEFINED_MARKER) return undefined;
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    if (value[0] === SET_MARKER) return new Set(value.slice(1).map(posttransformValue));
    return value.map(posttransformValue);
  }

  const entries = Object.entries(value).filter(([key]) => key !== TYPE_KEY);
  switch (value[TYPE_KEY]) {
    case 'Map':
      return new Map(entries.map(([key, item]) => [key, posttransformValue(item)]));
    case 'NumberMap':
      return new Map(
        entries.map(([key, item]) => [
          isNumberLike(key) ? Number(key) : key,
          posttransformValue(item),
        ]),
      );
    case 'Date': {
      const { Y, M, D, h, m, s } = value as JSONSafeDate;
      return new Date(Y!, M! - 1, D, h, m, s);
    }
    case 'function':
      throw new Error('A function can not be restored');
    default:
      return posttransformObject(value);
  }
}

const restoredTypes = new Set(['Map', 'NumberMap', 'Date']);

export function restoreMarkedJsonValue(value: JSONSafeValue): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value[0] !== SET_MARKER ? value : posttransformValue(value);
  }
  if (!(TYPE_KEY in value)) return value;
  if (!restoredTypes.has(value[TYPE_KEY])) return value;
  return posttransformValue(value);
}

function posttransformObject(object: JSONSafeObject) {
  return Object.fromEntries(
    Object.entries(object).map(([key, item]) => [key, posttransformValue(item)]),
  );
}
