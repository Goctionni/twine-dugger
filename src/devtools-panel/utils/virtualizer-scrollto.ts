import type { Virtualizer, VirtualizerOptions } from '@tanstack/solid-virtual';
import { elementScroll } from '@tanstack/solid-virtual';

type TVirtualizer = Virtualizer<HTMLDivElement, Element>;
type TVirtualizerOptions = VirtualizerOptions<HTMLDivElement, Element>;
type ScrollToFn = TVirtualizerOptions['scrollToFn'];
type ScrollToOptions = Parameters<ScrollToFn>[1];

let scrollingRef = 0;

const scroll_duration = 500;
const easeInOutQuint = (t: number) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;

export function virtualizerScrollToFn(
  offset: number,
  options: ScrollToOptions,
  instance: TVirtualizer,
) {
  const isSmooth = options?.behavior === 'smooth';
  if (!isSmooth) return elementScroll(offset, options, instance);

  const start = instance.scrollOffset ?? 0;
  const startTime = (scrollingRef = Date.now());

  requestAnimationFrame(function run() {
    if (scrollingRef !== startTime) return;

    const elapsed = Date.now() - startTime;
    const progress = easeInOutQuint(Math.min(elapsed / scroll_duration, 1));
    const interpolated = start + (offset - start) * progress;

    elementScroll(interpolated, {}, instance);
    if (progress < 1) requestAnimationFrame(run);
  });
}
