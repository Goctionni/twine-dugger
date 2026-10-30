import { createEffect, onSettled } from 'solid-js';

import { highlightRanges, type CharRange } from '@/devtools-panel/ui/util/range-highlight';

/**
 * Directive factory, used as `ref={highlight(() => ranges)}`: marks the ranges of the text inside
 * the element as search matches, without changing its markup. The ranges count over all the text
 * of the element.
 */
export function highlight(getRanges: () => readonly CharRange[]) {
  let element: HTMLElement | undefined;
  let ranges: readonly CharRange[] = [];
  let clear = () => {};

  const mark = () => {
    clear();
    clear = element ? highlightRanges(element, ranges) : () => {};
  };

  createEffect(
    () => getRanges().map(([start, end]) => [start, end] as const),
    (next) => {
      ranges = next;
      mark();
      return () => clear();
    },
  );

  // A marked range does not follow when the text of the element is replaced
  onSettled(() => {
    if (!element) return;
    const observer = new MutationObserver(mark);
    observer.observe(element, { characterData: true, childList: true, subtree: true });
    return () => observer.disconnect();
  });

  return (target: HTMLElement) => {
    element = target;
  };
}
