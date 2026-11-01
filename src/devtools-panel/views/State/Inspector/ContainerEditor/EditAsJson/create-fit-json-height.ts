import { createEffect, type Accessor } from 'solid-js';

/** Minimum box height, matching the `min-h-55` class */
const MIN_HEIGHT = 220;
/** Space reserved below the box so the Cancel / Save row stays visible */
const FOOTER_RESERVE = 120;

interface Options {
  /** The textarea, once mounted */
  getArea: Accessor<HTMLTextAreaElement | undefined>;
  /** Current text; read so the cap refits when the text changes */
  getText: Accessor<string>;
}

/**
 * Caps the JSON box at what fits in its scrolling pane, minus room for the Cancel / Save row:
 * the box grows with its text to the cap, then scrolls on its own. The cap refits when the
 * text changes and when the pane resizes.
 */
export function createFitJsonHeight(options: Options) {
  const { getArea, getText } = options;

  const refit = () => {
    const area = getArea();
    if (!area) return;
    const pane = (area.closest('aside, [data-scroll-pane]') ??
      area.parentElement) as HTMLElement | null;
    if (!pane) return;
    const paneRect = pane.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    // Clip to what is visible when the box is partly scrolled out of view
    const visibleTop = Math.max(paneRect.top, areaRect.top);
    const cap = paneRect.bottom - visibleTop - FOOTER_RESERVE;
    area.style.maxHeight = `${Math.max(MIN_HEIGHT, cap)}px`;
    // Scroll the box back into view after it shrinks
    area.scrollIntoView?.({ block: 'nearest' });
  };
  createEffect(
    () => ({ area: getArea(), text: getText() }),
    () => refit(),
  );

  // The pane can resize without the text changing (split flip, divider drag, window resize)
  createEffect(
    () => getArea()?.closest('aside, [data-scroll-pane]') ?? getArea()?.parentElement,
    (pane) => {
      if (!(pane instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => refit());
      observer.observe(pane);
      return () => observer.disconnect();
    },
  );
}
