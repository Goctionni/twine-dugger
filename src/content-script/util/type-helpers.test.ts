import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { isObj, matchesSChema } from './type-helpers';

describe('content-script util type-helpers', () => {
  it('should match schema when value conforms and reject otherwise', () => {
    const schema = z.object({ name: z.string(), count: z.number() });

    expect(matchesSChema({ name: 'x', count: 1 }, schema)).toBe(true);
    expect(matchesSChema({ name: 'x', count: '1' }, schema)).toBe(false);
  });

  it('should identify object-like values', () => {
    expect(isObj({})).toBe(true);
    expect(isObj([])).toBe(true);
    expect(isObj(new Map())).toBe(true);
    expect(isObj(null)).toBe(false);
    expect(isObj(undefined)).toBe(false);
    expect(isObj(1)).toBe(false);
    expect(isObj('x')).toBe(false);
  });
});
