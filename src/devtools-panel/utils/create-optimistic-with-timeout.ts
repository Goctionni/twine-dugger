import type { Accessor } from 'solid-js';
import { TimeoutError, action, createMemo, createOptimistic, until } from 'solid-js';

/**
 * A value that shows what was just set right away, while the real source (`input`) catches up.
 * It goes back to the input as soon as the input is evaluated again (it was updated, or it now
 * reads something else), or when that does not happen within the timeout.
 *
 * While a write is waiting, new writes are ignored, and `isOptimistic` is true. The input should
 * only be evaluated again when something really changed, because any new evaluation ends the wait,
 * also one that gives the same value. The setter sends the value to the real source, and may be async.
 */
export function createOptimisticWithTimeout<T>(
  input: Accessor<T>,
  setter: (value: T) => unknown,
  timeout: Accessor<number>,
): [value: Accessor<T>, set: (value: T) => Promise<void>, isOptimistic: Accessor<boolean>] {
  const [getValue, setValue] = createOptimistic(input);
  // Both are true during the wait. The flag is for readers; the variable is for a second call
  // that comes before the flag is visible
  const [isOptimistic, setIsOptimistic] = createOptimistic(false);
  let isWaiting = false;

  const getEvaluations = createMemo<number>((count) => {
    input();
    return (count ?? 0) + 1;
  });

  const set = action(function* (value: T) {
    if (isWaiting) return;
    isWaiting = true;
    const evaluations = getEvaluations();
    setValue(() => value);
    setIsOptimistic(true);
    try {
      yield setter(value);
      yield until(() => getEvaluations() !== evaluations, { timeout: timeout() });
    } catch (error) {
      // Running out of time is normal: the value goes back to what the input has
      if (!(error instanceof TimeoutError)) console.error('Failed to set the value:', error);
    } finally {
      isWaiting = false;
    }
  });

  return [getValue, set, isOptimistic];
}
