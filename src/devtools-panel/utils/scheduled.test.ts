import { createEffect, createRoot, createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createScheduled, throttle } from './scheduled';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('throttle', () => {
  it('calls once per window with the last arguments', () => {
    const fn = vi.fn<(v: number) => void>();
    const throttled = throttle(fn, 100);
    throttled(1);
    throttled(2);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('can be cleared', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled.clear();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('createScheduled', () => {
  it('is true in an effect once the schedule has fired after a change', () => {
    const [count, setCount] = createSignal(0);
    const seen: Array<[number, boolean]> = [];

    const dispose = createRoot((dispose) => {
      const scheduled = createScheduled((fn) => throttle(fn, 100));
      createEffect(
        () => [count(), scheduled()] as const,
        ([value, isReady]) => {
          seen.push([value, isReady]);
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
    expect(seen.every(([, isReady]) => !isReady)).toBe(true);

    vi.advanceTimersByTime(100);
    flush();
    expect(seen.at(-1)).toEqual([2, true]);
    dispose();
  });
});
