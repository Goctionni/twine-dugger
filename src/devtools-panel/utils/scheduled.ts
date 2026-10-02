// Adapted from @solid-primitives/scheduled, for Solid 2.0 and only what is used here.
import { type Accessor, createSignal, getObserver, getOwner, onCleanup } from 'solid-js';

interface Scheduled<Args extends unknown[]> {
  (...args: Args): void;
  clear: VoidFunction;
}

type ScheduleCallback = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait?: number,
) => Scheduled<Args>;

export const throttle: ScheduleCallback = (callback, wait) => {
  let isThrottled = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let lastArgs: Parameters<typeof callback>;

  const throttled: typeof callback = (...args) => {
    lastArgs = args;
    if (isThrottled) return;
    isThrottled = true;
    timeoutId = setTimeout(() => {
      callback(...lastArgs);
      isThrottled = false;
    }, wait);
  };

  const clear = () => {
    clearTimeout(timeoutId);
    isThrottled = false;
  };
  if (getOwner()) onCleanup(clear);

  return Object.assign(throttled, { clear });
};

/**
 * Like `throttle`, but the callback runs when the browser is idle (or after `maxWait`).
 * `requestIdleCallback` doesn't exist in Safari, where this falls back to `throttle`.
 */
export const scheduleIdle: ScheduleCallback =
  typeof requestIdleCallback === 'undefined'
    ? (callback) => throttle(callback)
    : (callback, maxWait) => {
        let isDeferred = false;
        let id: ReturnType<typeof requestIdleCallback>;
        let lastArgs: Parameters<typeof callback>;

        const deferred: typeof callback = (...args) => {
          lastArgs = args;
          if (isDeferred) return;
          isDeferred = true;
          id = requestIdleCallback(
            () => {
              callback(...lastArgs);
              isDeferred = false;
            },
            { timeout: maxWait },
          );
        };

        const clear = () => {
          cancelIdleCallback(id);
          isDeferred = false;
        };
        if (getOwner()) onCleanup(clear);

        return Object.assign(deferred, { clear });
      };

/**
 * Creates a signal used for scheduling execution of solid computations by tracking. The function
 * it returns is `true` when the schedule has fired since the source last changed.
 *
 * ```ts
 * const scheduled = createScheduled((fn) => throttle(fn, 250));
 * createEffect(
 *   () => [count(), scheduled()],
 *   ([value, isReady]) => { if (isReady) console.log('count', value); },
 * );
 * ```
 *
 * Thanks to Fabio Spampinato (https://github.com/fabiospampinato) for the idea for the primitive.
 */
export function createScheduled(
  schedule: (callback: VoidFunction) => VoidFunction,
): Accessor<boolean> {
  let listeners = 0;
  let isDirty = false;
  const [track, dirty] = createSignal(undefined, { equals: false });
  const call = schedule(() => {
    isDirty = true;
    dirty();
  });

  return () => {
    if (!isDirty) {
      call();
      track();
    }

    if (isDirty) {
      isDirty = !!listeners;
      return true;
    }

    if (getObserver()) {
      listeners++;
      onCleanup(() => listeners--);
    }
    return false;
  };
}
