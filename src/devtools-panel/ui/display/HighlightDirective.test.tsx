import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, beforeAll, expect, it } from 'vite-plus/test';

import { getMarkedText, installFakeHighlights } from '@/testing/test-highlights';

import { highlight } from './HighlightDirective';

beforeAll(installFakeHighlights);
afterEach(cleanup);

it('marks the ranges of the text of the element, and moves them when they change', async () => {
  const [getRanges, setRanges] = createSignal<Array<readonly [number, number]>>([[0, 4]]);
  render(() => <span ref={highlight(getRanges)}>gold coins</span>);
  flush();
  expect(getMarkedText()).toEqual(['gold']);

  setRanges([[5, 10]]);
  flush();
  expect(getMarkedText()).toEqual(['coins']);
});

it('marks again when the text is replaced, and nothing is left behind when it goes', async () => {
  const [getText, setText] = createSignal('gold coins');
  const { unmount } = render(() => <span ref={highlight(() => [[0, 4]])}>{getText()}</span>);
  flush();
  expect(getMarkedText()).toEqual(['gold']);

  setText('golden');
  flush();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(getMarkedText()).toEqual(['gold']);

  unmount();
  expect(getMarkedText()).toEqual([]);
});
