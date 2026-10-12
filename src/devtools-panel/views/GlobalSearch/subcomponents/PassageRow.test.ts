import { describe, expect, it } from 'vite-plus/test';

import { snippetAround } from './PassageRow';

describe('snippetAround', () => {
  const content = 'x'.repeat(100) + 'NEEDLE' + 'y'.repeat(200);

  it('cuts around the match and moves the range with it', () => {
    const { text, ranges } = snippetAround(content, [100, 106]);
    expect(text.startsWith('…') && text.endsWith('…')).toBe(true);
    expect(text.slice(...(ranges[0] as [number, number]))).toBe('NEEDLE');
  });

  it('does not add ellipses where nothing was cut', () => {
    const { text, ranges } = snippetAround('a cat', [2, 5]);
    expect(text).toBe('a cat');
    expect(ranges).toEqual([[2, 5]]);
  });

  it('makes one line, without moving the match', () => {
    const { text, ranges } = snippetAround('one\ntwo\r\n  cat', [11, 14]);
    expect(text).not.toMatch(/\n|\r/);
    expect(text.slice(...(ranges[0] as [number, number]))).toBe('cat');
  });
});
