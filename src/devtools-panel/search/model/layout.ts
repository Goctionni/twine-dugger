import { createMemo, createSignal, onSettled } from 'solid-js';

import type { NarrowStyle } from '../core/types';

/** From this width the filters are a rail beside the results; below it, a strip or a bar */
export const RAIL_MIN_WIDTH = 760;
/** From this width the detail is a column beside the results; below it, it covers them */
export const DETAIL_MIN_WIDTH_WITH_RAIL = 1120;
export const DETAIL_MIN_WIDTH = 900;

export type FilterMode = 'rail' | NarrowStyle;
export type DetailMode = 'column' | 'sheet';

/** The width of an element as it changes. Where DevTools is docked decides the shape of the page */
export function createContainerWidth(getElement: () => HTMLElement | undefined) {
  const [width, setWidth] = createSignal(0, { ownedWrite: true });

  onSettled(() => {
    const element = getElement();
    if (!element) return;
    setWidth(element.offsetWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  });

  return width;
}

/** What is mounted follows from the width: only the layout that is in use exists */
export function createLayoutModes(width: () => number, narrowStyle: () => NarrowStyle) {
  const filterMode = createMemo<FilterMode>(() =>
    width() >= RAIL_MIN_WIDTH ? 'rail' : narrowStyle(),
  );
  const detailMode = createMemo<DetailMode>(() => {
    const needed = filterMode() === 'rail' ? DETAIL_MIN_WIDTH_WITH_RAIL : DETAIL_MIN_WIDTH;
    return width() >= needed ? 'column' : 'sheet';
  });
  return { filterMode, detailMode };
}
