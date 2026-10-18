import type { Accessor } from 'solid-js';
import { createSignal, onSettled } from 'solid-js';

/** The width of an element as it changes: 0 until it is measured, when the page is made */
export function createElementWidth(getElement: () => HTMLElement | undefined): Accessor<number> {
  const [getWidth, setWidth] = createSignal(0);

  onSettled(() => {
    const element = getElement()!;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  });

  return getWidth;
}
