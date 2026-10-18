import { createRoot, createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';

import { createOptimisticWithTimeout } from './create-optimistic-with-timeout';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function setup(timeout: () => number = () => 1000) {
  const [getSource, setSource] = createSignal(1);
  // A source that always counts as a new answer, also when it is set to what it was
  const [getChanged, setChanged] = createSignal(0, { equals: false });
  const setter = vi.fn(async (_value: number) => {});

  let dispose = () => {};
  const [getValue, set, isOptimistic] = createRoot((d) => {
    dispose = d;
    return createOptimisticWithTimeout(
      () => {
        getChanged();
        return getSource();
      },
      setter,
      timeout,
    );
  });
  const answer = (value: number) => {
    setSource(value);
    setChanged(0);
    flush();
  };
  return { getValue, set, isOptimistic, setter, answer, dispose };
}

it('shows what is set at once, and keeps it when the source answers with it', async () => {
  const { getValue, set, setter, answer, dispose } = setup();

  const done = set(5);
  flush();
  expect(getValue()).toBe(5);
  expect(setter).toHaveBeenCalledWith(5);

  answer(5);
  await done;
  flush();
  expect(getValue()).toBe(5);
  dispose();
});

it('goes back to the input when it does not answer in time', async () => {
  const { getValue, set, dispose } = setup(() => 1000);

  const done = set(5);
  flush();
  expect(getValue()).toBe(5);

  await vi.advanceTimersByTimeAsync(999);
  flush();
  expect(getValue()).toBe(5);

  await vi.advanceTimersByTimeAsync(2);
  await done;
  flush();
  expect(getValue()).toBe(1);
  dispose();
});

it('takes an answer that is another value, at once, without waiting for the timeout', async () => {
  const { getValue, set, answer, dispose } = setup();

  const done = set(5);
  flush();
  answer(9);
  await done;
  flush();
  expect(getValue()).toBe(9);
  dispose();
});

it('takes an answer that is the same value as before: the input read something new', async () => {
  const { getValue, set, answer, dispose } = setup();

  const done = set(5);
  flush();
  expect(getValue()).toBe(5);
  answer(1);
  await done;
  flush();
  expect(getValue()).toBe(1);
  dispose();
});

it('ignores a write while one is waiting, and takes the next one when it is over', async () => {
  const { getValue, set, setter, answer, dispose } = setup();

  const first = set(5);
  flush();
  void set(7);
  flush();
  expect(setter).toHaveBeenCalledTimes(1);
  expect(getValue()).toBe(5);

  answer(5);
  await first;
  flush();

  const next = set(7);
  flush();
  expect(setter).toHaveBeenCalledTimes(2);
  expect(setter).toHaveBeenLastCalledWith(7);
  expect(getValue()).toBe(7);
  answer(7);
  await next;
  dispose();
});

it('is optimistic from the write until the wait is over', async () => {
  const { set, isOptimistic, answer, dispose } = setup(() => 1000);
  expect(isOptimistic()).toBe(false);

  const done = set(5);
  flush();
  expect(isOptimistic()).toBe(true);

  answer(5);
  await done;
  flush();
  expect(isOptimistic()).toBe(false);

  const timedOut = set(6);
  flush();
  expect(isOptimistic()).toBe(true);
  await vi.advanceTimersByTimeAsync(1100);
  await timedOut;
  flush();
  expect(isOptimistic()).toBe(false);
  dispose();
});

it('takes the timeout from a function, when it is made', async () => {
  const { getValue, set, dispose } = setup(() => 300);

  const done = set(5);
  flush();
  await vi.advanceTimersByTimeAsync(400);
  await done;
  flush();
  expect(getValue()).toBe(1);
  dispose();
});

it('goes back, and says why, when the setter fails', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { getValue, set, setter, dispose } = setup();
  setter.mockRejectedValueOnce(new Error('no connection'));

  const done = set(5);
  flush();
  await done;
  flush();
  expect(getValue()).toBe(1);
  expect(error).toHaveBeenCalledWith('Failed to set the value:', expect.any(Error));
  error.mockRestore();
  dispose();
});
