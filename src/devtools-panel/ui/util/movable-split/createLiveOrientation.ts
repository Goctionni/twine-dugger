import { createEffect, createSignal } from 'solid-js';

export type SplitOrientation = 'vertical' | 'horizontal';
export type SplitDirection = 'auto' | SplitOrientation;

export function createLiveOrientation(
  getDirection: () => SplitDirection,
  getContainer: () => HTMLElement | undefined,
) {
  const [getLiveOrientation, setLiveOrientation] = createSignal<SplitOrientation>('horizontal');

  createEffect(
    () => getDirection() === 'auto',
    (isAuto) => {
      if (!isAuto) return;
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry!.contentRect;
        // UI needs more room horizontally than vertically, so below some cutoff default to a vertical stack
        setLiveOrientation(width < 700 || height > width ? 'vertical' : 'horizontal');
      });
      observer.observe(getContainer()!);
      return () => observer.disconnect();
    },
  );

  return (): SplitOrientation => {
    const direction = getDirection();
    return direction === 'auto' ? getLiveOrientation() : direction;
  };
}
