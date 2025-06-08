import { ObjectValue, Value } from './shared-types';

export function copy<T extends Value>(value: T): Value {
  try {
    return structuredClone(value);
  } catch (ex) {
    if (typeof value === 'function') return value;
    if (typeof value !== 'object') return value;
    if (!value) return !value;

    if (Array.isArray(value)) return value.map((v) => copy(v));
    if (value instanceof Map) {
      return new Map(value.entries().map(([attr, entryValue]) => [attr, copy(entryValue)]));
    }
    if (value instanceof Set) return new Set(value.values().map((v) => copy(v)));

    const keys = Object.keys(value);
    const obj: ObjectValue = {};
    for (const key of keys) {
      obj[key] = copy(value[key]);
    }
    return obj;
  }
}
