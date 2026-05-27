import { describe, expect, it } from 'vite-plus/test';

import { pathEquals, pathStartsWith } from './path-equals';

describe('path-equals', () => {
  it('should compare exact path equality', () => {
    expect(pathEquals([], [])).toBe(true);
    expect(pathEquals(['a', 1], ['a', 1])).toBe(true);
    expect(pathEquals(['a'], ['a', 1])).toBe(false);
    expect(pathEquals(['a', 1], ['a', 2])).toBe(false);
  });

  it('should detect path prefix matches', () => {
    expect(pathStartsWith(['a', 1, 'x'], ['a', 1])).toBe(true);
    expect(pathStartsWith(['a', 1], ['a', 1])).toBe(true);
    expect(pathStartsWith(['a'], ['a', 1])).toBe(false);
    expect(pathStartsWith(['a', 1], ['a', 2])).toBe(false);
    expect(pathStartsWith([], [])).toBe(true);
  });
});
