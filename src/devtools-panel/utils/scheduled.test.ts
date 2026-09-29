import { createEffect, createRoot, createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createScheduled, debounce, throttle } from './scheduled';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('debounce / throttle', () => {
  it('debounce calls on the trailing edge with the last arguments', () => {
    const fn = vi.fn<(v: number) => void>();
    const debounced = debounce(fn, 100);
    debounced(1);
    vi.advanceTimersByTime(50);
    debounced(2);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('throttle calls once per window with the last arguments', () => {
    const fn = vi.fn<(v: number) => void>();
    const throttled = throttle(fn, 100);
    throttled(1);
    throttled(2);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledExactlyOnceWith(2);
  });
});

describe('createScheduled', () => {
  it('is true in an effect once the debounce has settled after a change', () => {
    const [count, setCount] = createSignal(0);
    const seen: Array<[number, boolean]> = [];

    const dispose = createRoot((dispose) => {
      const scheduled = createScheduled((fn) => debounce(fn, 100));
      createEffect(
        () => [count(), scheduled()] as const,
        ([value, dirty]) => {
          seen.push([value, dirty]);
        },
      );
      return dispose;
    });
    flush();
    expect(seen.at(-1)).toEqual([0, false]);

    setCount(1);
    flush();
    setCount(2);
    flush();
    expect(seen.every(([, dirty]) => !dirty)).toBe(true);

    vi.advanceTimersByTime(100);
    flush();
    expect(seen.at(-1)).toEqual([2, true]);
    dispose();
  });
});
