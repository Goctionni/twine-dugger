import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { highlightRanges } from './range-highlight';
import { getMarkedText, installFakeHighlights } from './test-highlights';

let host: HTMLElement;
beforeEach(() => {
  installFakeHighlights();
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => host.remove());

const marked = getMarkedText;

describe('highlightRanges', () => {
  it('marks text that is spread over several elements', () => {
    host.innerHTML = '<span>player</span><span>.</span><span>gold</span>';
    highlightRanges(host, [
      [3, 8],
      [9, 11],
    ]);
    expect(marked()).toEqual(['yer.g', 'ld']);
  });

  it('marks nothing for ranges outside the text, and takes its marks away on cleanup', () => {
    host.textContent = 'abc';
    const clear = highlightRanges(host, [
      [1, 2],
      [10, 12],
    ]);
    expect(marked()).toEqual(['b']);
    clear();
    expect(marked()).toEqual([]);
  });

  it('does not change the markup', () => {
    host.innerHTML = '<span>a</span><span>b</span>';
    highlightRanges(host, [[0, 2]]);
    expect(host.innerHTML).toBe('<span>a</span><span>b</span>');
  });
});
