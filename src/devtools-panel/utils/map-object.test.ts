import { describe, expect, it } from 'vite-plus/test';

import { mapObject } from './map-object';

describe('mapObject', () => {
  it('keeps the properties and replaces the values', () => {
    expect(mapObject({ a: 1, b: 2 }, (value) => value * 10)).toEqual({ a: 10, b: 20 });
  });

  it('gives the key as well', () => {
    expect(mapObject({ a: 1, b: 2 }, (value, key) => `${key}${value}`)).toEqual({
      a: 'a1',
      b: 'b2',
    });
  });
});
