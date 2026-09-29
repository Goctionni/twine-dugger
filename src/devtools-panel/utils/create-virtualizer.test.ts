import { createRoot, createSignal, flush } from 'solid-js';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createVirtualizer } from './create-virtualizer';

const element = {} as HTMLDivElement;
const disposers: Array<() => void> = [];
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()));

/** Creates the virtualizer in a root, but hands back what's needed to poke at it from outside */
function setup(initialCount: number) {
  let scrollTo: (offset: number) => void = () => {};

  const { virtualizer, setCount } = createRoot((dispose) => {
    disposers.push(dispose);
    const [count, setCount] = createSignal(initialCount);

    const virtualizer = createVirtualizer<HTMLDivElement, Element>({
      getScrollElement: () => element,
      estimateSize: () => 10,
      get count() {
        return count();
      },
      overscan: 0,
      initialRect: { width: 100, height: 50 },
      // jsdom has no layout, so the scroll element is faked
      observeElementRect: (_, cb) => {
        cb({ width: 100, height: 50 });
        return () => {};
      },
      observeElementOffset: (_, cb) => {
        scrollTo = (offset) => cb(offset, true);
        cb(0, false);
        return () => {};
      },
      scrollToFn: () => {},
    });
    return { virtualizer, setCount };
  });
  flush();

  const indexes = () => virtualizer.getVirtualItems().map((item) => item.index);
  return { virtualizer, indexes, setCount, scrollTo: (offset: number) => scrollTo(offset) };
}

describe('createVirtualizer', () => {
  it('renders the items in view and follows a reactive count', () => {
    const { virtualizer, indexes, setCount } = setup(100);

    expect(indexes().slice(0, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(indexes().length).toBeLessThanOrEqual(6);
    expect(virtualizer.getTotalSize()).toBe(1000);

    setCount(3);
    flush();
    expect(indexes()).toEqual([0, 1, 2]);
    expect(virtualizer.getTotalSize()).toBe(30);
  });

  it('moves the window when scrolled, and keeps the items that stay in view', () => {
    const { virtualizer, indexes, scrollTo } = setup(100);
    const before = virtualizer.getVirtualItems().find((item) => item.index === 4)!;

    scrollTo(20);
    flush();
    expect(indexes()[0]).toBe(2);

    const after = virtualizer.getVirtualItems().find((item) => item.index === 4)!;
    expect(after).toBe(before);
    expect(after.start).toBe(40);
  });
});
