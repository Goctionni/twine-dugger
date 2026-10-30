import { defaultRangeExtractor, type VirtualItem } from '@tanstack/virtual-core';
import { createEffect, createMemo, onCleanup, onSettled, untrack } from 'solid-js';

import { createVirtualizer } from '@/devtools-panel/utils/create-virtualizer';
import { sameItems } from '@/devtools-panel/utils/same-items';

interface Options {
  /** The key of each item, in the order that they are shown: an item that moves keeps its element */
  getKeys: () => ReadonlyArray<string | number>;
  /** The height of an item before it has been measured (measuring sets it right at any zoom) */
  estimateSize: number;
  /** Space between the items */
  gap?: number;
  /** The selected item (-1 for none): it stays in the DOM, so that the list can name it as active, and is what `scrollToSelection` goes to */
  getSelectedIndex?: () => number;
  /** Items that stay in the DOM outside the window as well (an item that has the focus, or something typed in it) */
  getKeptKeys?: () => ReadonlyArray<string | number>;
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

  const getIndexByKey = createMemo(
    () => new Map(options.getKeys().map((key, index) => [key, index])),
  );
  // Outside the window as well: the selected item, so that the list can name it as active, and the kept ones
  const getKeptIndexes = createMemo(
    () => {
      const indexByKey = getIndexByKey();
      const indexes = (options.getKeptKeys?.() ?? []).flatMap((key) => indexByKey.get(key) ?? []);
      const selectedIndex = options.getSelectedIndex?.() ?? -1;
      return (selectedIndex >= 0 ? [...indexes, selectedIndex] : indexes).sort((a, b) => a - b);
    },
    { equals: sameItems },
  );

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
    overscan: 4,
    // Measuring inside the callback of the observer changes the layout, which the browser reports as a loop
    useAnimationFrameWithResizeObserver: true,
    // The virtualizer only looks at the range again when its options change: a getter that reads the kept items
    get rangeExtractor() {
      return keepIndexes(getKeptIndexes());
    },
  });

  // What is above the list can change without the list knowing: it is measured again when the
  // items change, when the scroll area is resized, and before a scroll to an item. Two reads of
  // the layout each, no observer on what is above
  function measureScrollMargin() {
    if (!list) return;
    scrollElement ??= findScrollParent(list);
    if (!scrollElement) return;
    observeScrollArea(scrollElement);
    const offset = list.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top;
    const margin = Math.round(offset + scrollElement.scrollTop);
    if (margin === scrollMargin) return;
    scrollMargin = margin;
    virtualizer.syncOptions();
  }

  let observedScrollArea: HTMLElement | undefined;
  let scrollAreaObserver: ResizeObserver | undefined;
  function observeScrollArea(element: HTMLElement) {
    if (element === observedScrollArea || typeof ResizeObserver === 'undefined') return;
    scrollAreaObserver?.disconnect();
    observedScrollArea = element;
    // In a frame of its own: the observer must not be what changes the layout
    scrollAreaObserver = new ResizeObserver(() => requestAnimationFrame(measureScrollMargin));
    scrollAreaObserver.observe(element);
  }
  onCleanup(() => scrollAreaObserver?.disconnect());

  // After the render, when the list and the scroll area are there. Not in the effect itself: the
  // virtualizer follows a change of the items in an effect too, and would undo what is measured
  onSettled(measureScrollMargin);
  createEffect(options.getKeys, () => onSettled(measureScrollMargin));

  // Scrolls only as far as needed
  function scrollToIndex(index: number) {
    // The items may have changed in this very update, and the options follow it in an effect
    measureScrollMargin();
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
        .filter((item) => getIndexByKey().has(item.key as string | number)) as VirtualListItem[],
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

/** A range extractor that also has the indexes in the range that is extracted */
function keepIndexes(keptIndexes: readonly number[]) {
  return (range: Parameters<typeof defaultRangeExtractor>[0]) => {
    const indexes = defaultRangeExtractor(range);
    const outside = keptIndexes.filter((index) => index < range.count && !indexes.includes(index));
    return outside.length ? [...indexes, ...outside].sort((a, b) => a - b) : indexes;
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
