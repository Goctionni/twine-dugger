import { describe, expect, it } from 'vite-plus/test';

import { getPotentialId } from './id-helper';

describe('getPotentialId', () => {
  it('should return undefined for non-object-like values', () => {
    expect(getPotentialId(undefined)).toBeUndefined();
    expect(getPotentialId(null)).toBeUndefined();
    expect(getPotentialId('x')).toBeUndefined();
    expect(getPotentialId(1)).toBeUndefined();
    expect(getPotentialId(true)).toBeUndefined();
    expect(getPotentialId([1, 2, 3])).toBeUndefined();
    expect(getPotentialId(new Set([1]))).toBeUndefined();
  });

  it('should return first valid common id key from object', () => {
    expect(getPotentialId({ id: 123 })).toBe(123);
    expect(getPotentialId({ _id: 'abc' })).toBe('abc');
    expect(getPotentialId({ __id: 'z' })).toBe('z');
    expect(getPotentialId({ key: 'k1' })).toBe('k1');
    expect(getPotentialId({ uuid: 'u1' })).toBe('u1');
    expect(getPotentialId({ _uuid: 'u2' })).toBe('u2');
    expect(getPotentialId({ __uuid: 'u3' })).toBe('u3');
  });

  it('should skip empty and invalid id candidate values', () => {
    expect(getPotentialId({ id: '' })).toBeUndefined();
    expect(getPotentialId({ id: null })).toBeUndefined();
    expect(getPotentialId({ id: undefined })).toBeUndefined();
    expect(getPotentialId({ id: { nested: true } })).toBeUndefined();
    expect(getPotentialId({ id: () => 'x' })).toBeUndefined();
  });

  it('should read id from map values', () => {
    expect(getPotentialId(new Map([['id', 88]]))).toBe(88);
    expect(getPotentialId(new Map([['_uuid', 'map-u']]))).toBe('map-u');
    expect(getPotentialId(new Map([['id', '']]))).toBeUndefined();
  });
});
