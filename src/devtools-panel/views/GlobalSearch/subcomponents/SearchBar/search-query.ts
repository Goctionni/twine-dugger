import { createSignal, untrack } from 'solid-js';

import { getSettings } from '../../../../store/store';
import { createDefaultOptions, type SearchOptions } from '../../types';

// What is searched for is here and not in the component so that it is still there after visiting
// another page

export const [getSearchText, setSearchText] = createSignal('');

/** Starts as the settings remember it. A new object for every change */
export const [getSearchOptions, setSearchOptions] = createSignal<SearchOptions>(
  untrack(() =>
    getSettings.search.persist.options()
      ? { ...getSettings.search.saved.options() }
      : createDefaultOptions(),
  ),
);

/** The longest `whenIdle` waits for idle time: the user is waiting for the results */
const IDLE_TIMEOUT_MS = 50;

let pending: (() => void) | undefined;

/**
 * Calls `callback` when the browser has time for it, not inside the key press that caused it.
 * Calls made in the meantime are one: the last callback is the one that runs, so it should look at
 * what is current when it runs.
 */
export function whenIdle(callback: () => void) {
  const isScheduled = pending !== undefined;
  pending = callback;
  if (isScheduled) return;
  requestIdleCallback(
    () => {
      const run = pending;
      pending = undefined;
      run?.();
    },
    { timeout: IDLE_TIMEOUT_MS },
  );
}
