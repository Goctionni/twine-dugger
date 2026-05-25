import { describe, expect, it } from 'vite-plus/test';

import { copy } from './copy';

describe('copy', () => {
  it('should deep copy objects, arrays, maps, and sets', () => {
    const source = {
      obj: { a: 1 },
      arr: [{ b: 2 }],
      map: new Map<string, { c: number }>([['k', { c: 3 }]]),
      set: new Set([{ d: 4 }]),
    };

    const cloned = copy(source) as typeof source;

    expect(cloned).toEqual(source);
    expect(cloned).not.toBe(source);
    expect(cloned.obj).not.toBe(source.obj);
    expect(cloned.arr).not.toBe(source.arr);
    expect(cloned.map).toBeInstanceOf(Map);
    expect(cloned.map.get('k')).toEqual({ c: 3 });
    expect(cloned.map.get('k')).not.toBe(source.map.get('k'));
    expect(cloned.set).toBeInstanceOf(Set);

    const clonedSetEntry = [...cloned.set][0] as { d: number };
    const sourceSetEntry = [...source.set][0] as { d: number };
    expect(clonedSetEntry).toEqual(sourceSetEntry);
    expect(clonedSetEntry).not.toBe(sourceSetEntry);
  });

  it('should return primitives and null values without mutation', () => {
    expect(copy(7)).toBe(7);
    expect(copy('x')).toBe('x');
    expect(copy(false)).toBe(false);
    expect(copy(null)).toBeNull();
  });

  it('should preserve function reference when clone fallback is used', () => {
    const fn = () => 123;

    expect(copy(fn)).toBe(fn);
  });
});
