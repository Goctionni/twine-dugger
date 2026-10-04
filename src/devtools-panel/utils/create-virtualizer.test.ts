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

it('keeps an item as the same object when it moves, if reconciling by key', () => {
  using resource = createRoot((dispose) => {
    const [keys, setKeys] = createSignal(['a', 'b', 'c']);
    const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
      get count() {
        return keys().length;
      },
      // The virtualizer only looks at the keys again when its options change
      get getItemKey() {
        const staticKeys = keys();
        return (index: number) => staticKeys[index]!;
      },
      reconcileBy: 'key',
      getScrollElement: () => null,
      estimateSize: () => 20,
      initialRect: { width: 800, height: 600 },
    });
    return { virtualizer, setKeys, [Symbol.dispose]: dispose };
  });
  const { virtualizer, setKeys } = resource;
  flush();

  const before = new Map(virtualizer.getVirtualItems().map((item) => [item.key, item]));
  expect([...before.keys()]).toEqual(['a', 'b', 'c']);

  // Same count: only the keys at the positions change
  setKeys(['c', 'a', 'd']);
  flush();
  const after = virtualizer.getVirtualItems();
  expect(after.map((item) => item.key)).toEqual(['c', 'a', 'd']);
  expect(after[0]).toBe(before.get('c'));
  expect(after[1]).toBe(before.get('a'));
  expect(after[0]!.index).toBe(0);
  expect(after[1]!.start).toBe(20);
  expect(before.has('d')).toBe(false);
});
