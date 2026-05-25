import { describe, expect, it } from 'vite-plus/test';

import {
  getSpecificType,
  isArray,
  isBoolean,
  isFunction,
  isMap,
  isNull,
  isNullish,
  isNumber,
  isObject,
  isPrimitive,
  isSet,
  isString,
  isUndefined,
} from './type-helpers';

describe('type-helpers', () => {
  it('should identify primitive helper checks', () => {
    expect(isString('x')).toBe(true);
    expect(isNumber(1)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isNull(null)).toBe(true);
    expect(isUndefined(undefined)).toBe(true);
    expect(isNullish(null)).toBe(true);
    expect(isNullish(undefined)).toBe(true);
    expect(isNullish(0)).toBe(false);
  });

  it('should identify structured helper checks', () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isArray([1])).toBe(true);
    expect(isSet(new Set([1]))).toBe(true);
    expect(isMap(new Map())).toBe(true);
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(new Set())).toBe(false);
    expect(isObject(new Map())).toBe(false);
    expect(isObject(null)).toBe(false);
  });

  it('should resolve specific types in priority order', () => {
    expect(getSpecificType((() => {}) as any)).toBe('function');
    expect(getSpecificType([1] as any)).toBe('array');
    expect(getSpecificType(new Set([1]) as any)).toBe('set');
    expect(getSpecificType(new Map([['k', 1]]) as any)).toBe('map');
    expect(getSpecificType('x' as any)).toBe('string');
    expect(getSpecificType(1 as any)).toBe('number');
    expect(getSpecificType(null as any)).toBe('null');
    expect(getSpecificType(true as any)).toBe('boolean');
    expect(getSpecificType(undefined as any)).toBe('undefined');
    expect(getSpecificType({ a: 1 } as any)).toBe('object');
    expect(getSpecificType(Symbol('x') as any)).toBe('other');
  });

  it('should classify primitive values correctly', () => {
    expect(isPrimitive('x')).toBe(true);
    expect(isPrimitive(1)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
    expect(isPrimitive(undefined)).toBe(true);
    expect(isPrimitive(null)).toBe(false);
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(isPrimitive(new Set())).toBe(false);
    expect(isPrimitive(new Map())).toBe(false);
    expect(isPrimitive(() => {})).toBe(false);
  });
});
