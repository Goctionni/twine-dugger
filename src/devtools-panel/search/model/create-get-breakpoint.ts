import { createMemo, createSignal, onCleanup } from 'solid-js';

import type { Breakpoint } from '../types';

/** The width of the window as it changes. Where DevTools is docked decides the shape of the page */
function createGetWindowWidth() {
  const [width, setWidth] = createSignal(window.innerWidth);
  const update = () => setWidth(window.innerWidth);
  window.addEventListener('resize', update);
  onCleanup(() => window.removeEventListener('resize', update));
  return width;
}

export function createGetBreakpoint() {
  const getWidth = createGetWindowWidth();

  return createMemo((): Breakpoint => {
    const width = getWidth();
    if (width < 760) return 'sm';
    if (width < 1120) return 'md';
    return 'lg';
  });
}
