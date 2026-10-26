import {
  isNumberLike,
  NAN_MARKER,
  NEGATIVE_INFINITY_MARKER,
  POSITIVE_INFINITY_MARKER,
  SET_MARKER,
  TYPE_KEY,
  UNDEFINED_MARKER,
} from '@/shared/json-safe';
import type { JSONSafeDate, JSONSafeValue } from '@/shared/shared-types';

export function posttransformValue(value: JSONSafeValue, { deep = false } = {}): unknown {
  if (value === NAN_MARKER) return Number.NaN;
  if (value === POSITIVE_INFINITY_MARKER) return Infinity;
  if (value === NEGATIVE_INFINITY_MARKER) return -Infinity;
  if (value === UNDEFINED_MARKER) return undefined;
  if (value === null || typeof value !== 'object') return value;

  const inside = (item: JSONSafeValue) => (deep ? posttransformValue(item, { deep }) : item);

  if (Array.isArray(value)) {
    if (value[0] === SET_MARKER) return new Set(value.slice(1).map(inside));
    return deep ? value.map(inside) : value;
  }

  const entries = Object.entries(value).filter(([key]) => key !== TYPE_KEY);
  switch (value[TYPE_KEY]) {
    case 'Map':
      return new Map(entries.map(([key, item]) => [key, inside(item)]));
    case 'NumberMap':
      return new Map(
        entries.map(([key, item]) => [isNumberLike(key) ? Number(key) : key, inside(item)]),
      );
    case 'Date': {
      const { Y, M, D, h, m, s } = value as JSONSafeDate;
      return new Date(Y!, M! - 1, D, h, m, s);
    }
    case 'function':
      throw new Error('A function can not be restored');
    default:
      return deep
        ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, inside(item)]))
        : value;
  }
}
