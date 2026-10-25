import { defaultRangeExtractor, type VirtualItem } from '@tanstack/virtual-core';
import { createMemo, onSettled, untrack } from 'solid-js';

import { createVirtualizer } from '@/devtools-panel/utils/create-virtualizer';

interface Options {
  /** The key of each item, in the order that they are shown: an item that moves keeps its element */
  getKeys: () => ReadonlyArray<string | number>;
  /** The height of an item before it has been measured (measuring sets it right at any zoom) */
  estimateSize: number;
  /** Space between the items */
  gap?: number;
  /** The selected item (-1 for none): it stays in the DOM, so that the list can name it as active, and is what `scrollToSelection` goes to */
  getSelectedIndex?: () => number;
}

/** What the list shows of an item: where it is, and its key as given to `getKeys` */
export type VirtualListItem = Omit<VirtualItem, 'key'> & { key: string | number };

// Before the real size is known, so that the first render has rows
const INITIAL_HEIGHT = 800;

/**
 * Virtualizes a list of items of the same width in one column (see `VirtualItems` for the markup
 * of one). The element of the list is as tall as all the items and its nearest scrolling parent is
 * the one that scrolls; a sticky header that is a child of it is kept clear of what is scrolled to.
 */
export function createVirtualList(options: Options) {
  let list: HTMLElement | undefined;
  let scrollElement: HTMLElement | null = null;
  // How far the list starts from the top of what scrolls: what is above it. Not a signal: it is
  // measured after the render, and the virtualizer takes it in at once (a write there would wait)
  let scrollMargin = 0;

  const getKeySet = createMemo(() => new Set(options.getKeys()));

  const virtualizer = createVirtualizer<HTMLElement, HTMLElement>({
    get count() {
      return options.getKeys().length;
    },
    // The virtualizer only looks at the keys again when its options change: a getter that reads them
    get getItemKey() {
      const keys = options.getKeys();
      return (index: number) => keys[index]!;
    },
    reconcileBy: 'key',
    estimateSize: () => options.estimateSize,
    gap: options.gap,
    getScrollElement: () => {
      if (list && !scrollElement) scrollElement = findScrollParent(list);
      return scrollElement;
    },
    get scrollMargin() {
      return scrollMargin;
    },
    // A sticky header covers the top of what scrolls: what is scrolled to stays under it
    get scrollPaddingStart() {
      return scrollElement ? getStickyHeaderHeight(scrollElement) : 0;
    },
    initialRect: { width: 0, height: INITIAL_HEIGHT },
    overscan: 8,
    // Measuring inside the callback of the observer changes the layout, which the browser reports as a loop
    useAnimationFrameWithResizeObserver: true,
    get rangeExtractor() {
      const selectedIndex = options.getSelectedIndex?.() ?? -1;
      return (range: Parameters<typeof defaultRangeExtractor>[0]) => {
        const indexes = defaultRangeExtractor(range);
        if (selectedIndex < 0 || selectedIndex >= range.count || indexes.includes(selectedIndex)) {
          return indexes;
        }
        return [...indexes, selectedIndex].sort((a, b) => a - b);
      };
    },
  });

  onSettled(() => {
    if (!list || !scrollElement) return;
    const offset = list.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top;
    scrollMargin = Math.round(offset + scrollElement.scrollTop);
    virtualizer.syncOptions();
  });

  // Scrolls only as far as needed
  function scrollToIndex(index: number) {
    // The items may have changed in this very update, and the options follow it in an effect
    virtualizer.syncOptions();
    virtualizer.scrollToIndex(index, { align: 'auto' });
  }

  return {
    listRef: (element: HTMLElement) => {
      list = element;
      scrollElement = null;
    },
    getListElement: () => list,
    /** The items in the window. The list shrinks before the items follow: the ones that have no key any more are left out */
    getItems: () =>
      virtualizer
        .getVirtualItems()
        .filter((item) => getKeySet().has(item.key as string | number)) as VirtualListItem[],
    getTotalSize: () => virtualizer.getTotalSize(),
    /** Where an item goes in the list (its start counts from the top of what scrolls) */
    getOffset: (item: VirtualListItem) => item.start - scrollMargin,
    /** The ref of the element of an item: the virtualizer measures it, and finds the item by its `data-index` */
    measureItem: (element: HTMLElement, item: VirtualListItem) => {
      element.dataset.index = String(untrack(() => item.index));
      // After the render: measuring can change the items, which must not happen while they are rendered
      onSettled(() => {
        // Forgets the elements that are gone
        virtualizer.measureElement(null);
        virtualizer.measureElement(element);
      });
    },
    scrollToIndex,
    scrollToSelection: () => {
      const index = options.getSelectedIndex?.() ?? -1;
      if (index >= 0) scrollToIndex(index);
    },
  };
}

function getStickyHeaderHeight(scrollElement: HTMLElement) {
  const header = [...scrollElement.children].find(
    (child) => getComputedStyle(child).position === 'sticky',
  );
  return header instanceof HTMLElement ? header.offsetHeight : 0;
}

function findScrollParent(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent && !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) {
    parent = parent.parentElement;
  }
  return parent;
}
