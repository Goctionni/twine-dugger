import { createRoot, createSignal, flush } from 'solid-js';
import { expect, it } from 'vite-plus/test';

import { createVirtualizer } from './create-virtualizer';

it('preserves measured sizes when reactive options change', () => {
  using resource = createRoot((dispose) => {
    const [count, setCount] = createSignal(2);
    const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
      get count() {
        return count();
      },
      getScrollElement: () => null,
      estimateSize: () => 60,
      initialRect: { width: 800, height: 600 },
    });
    return { virtualizer, setCount, [Symbol.dispose]: dispose };
  });
  const { virtualizer, setCount } = resource;
  flush();

  expect(virtualizer.getTotalSize()).toBe(120);
  virtualizer.resizeItem(0, 100);
  flush();
  expect(virtualizer.getTotalSize()).toBe(160);

  setCount(3);
  flush();
  expect(virtualizer.itemSizeCache.get(0)).toBe(100);
  expect(virtualizer.getTotalSize()).toBe(220);
});
