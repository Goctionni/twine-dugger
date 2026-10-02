import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue } from '@/shared/shared-types';

export function posttransformValue(value: JSONSafeValue): unknown {
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    if (value[0] === SET_MARKER) return new Set(value.slice(1).map(posttransformValue));
    return value.map(posttransformValue);
  }

  const entries = Object.entries(value).filter(([key]) => key !== TYPE_KEY);
  switch (value[TYPE_KEY]) {
    case 'Map':
      return new Map(entries.map(([key, item]) => [key, posttransformValue(item)]));
    case 'Date': {
      const { Y, M, D, h, m, s } = value as Record<string, number>;
      return new Date(Y!, M! - 1, D, h, m, s);
    }
    case 'function':
      throw new Error('A function can not be restored');
    default:
      return posttransformObject(value);
  }
}

function posttransformObject(object: JSONSafeObject) {
  return Object.fromEntries(
    Object.entries(object).map(([key, item]) => [key, posttransformValue(item)]),
  );
}
