import { vi } from 'vite-plus/test';

interface Layout {
  /** The height of what scrolls */
  viewportHeight: number;
  /** The height of a virtual item (an element with a `data-index`) */
  itemHeight: number;
  /** The width of the scroll area and of what is in it, 400 by default */
  width?: number;
}

/**
 * For the tests of a virtual list: jsdom has no layout, so the virtualizer would see a scroll area of
 * no height and items of no height. This gives a scroll area (any element that is not an item) and
 * items a size, and puts a `scrollTo` on the elements. Put the list in an element with
 * `overflow-y: auto`; the result of `scrollTo` is the `scrollTo` mock. Call `restore()` afterwards.
 */
export function stubVirtualLayout({ viewportHeight, itemHeight, width = 400 }: Layout) {
  const isItem = (element: Element) => element.hasAttribute('data-index');

  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const offsetHeight = vi
    .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
    .mockImplementation(function (this: HTMLElement) {
      return isItem(this) ? itemHeight : viewportHeight;
    });
  const getBoundingClientRect = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      return {
        top: 0,
        left: 0,
        width,
        height: isItem(this) ? itemHeight : viewportHeight,
      } as DOMRect;
    });
  // What is left to scroll: the scroll area is taken to hold more than it shows
  const scrollHeight = vi
    .spyOn(Element.prototype, 'scrollHeight', 'get')
    .mockReturnValue(1_000_000);
  const clientHeight = vi
    .spyOn(Element.prototype, 'clientHeight', 'get')
    .mockReturnValue(viewportHeight);
  const scrollTo = vi.fn<(options: ScrollToOptions) => void>();
  Element.prototype.scrollTo = scrollTo as typeof Element.prototype.scrollTo;

  return {
    scrollTo,
    restore: () => {
      vi.unstubAllGlobals();
      offsetHeight.mockRestore();
      getBoundingClientRect.mockRestore();
      scrollHeight.mockRestore();
      clientHeight.mockRestore();
    },
  };
}
