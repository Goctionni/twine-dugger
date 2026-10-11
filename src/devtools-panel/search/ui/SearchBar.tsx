import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { createEffect, createSignal, For, Show } from 'solid-js';

import type { SearchOptions } from '../core/types';
import { useSearch } from '../model/context';
import { getOptions, getSearchText, setSearchText, toggleOption } from '../model/search-state';
import type { FilterLayout } from '../types';
import { LayoutToggle } from './filters/LayoutToggle';

const [getFocusRequests, setFocusRequests] = createSignal(0);

/** Asks the search input to take the focus: when it is on the page now, or as soon as it is */
export const requestSearchFocus = () => setFocusRequests((count) => count + 1);

/** The longest a search waits for idle time: the user is waiting for the results */
const SEARCH_IDLE_TIMEOUT_MS = 50;

let isSearchScheduled = false;

/**
 * Searches for what `read` returns when the browser is idle, not inside the key press that caused
 * it. Keys typed in the meantime are one search, for what the input has by then.
 */
export function setSearchTextWhenIdle(read: () => string) {
  if (isSearchScheduled) return;
  isSearchScheduled = true;
  requestIdleCallback(
    () => {
      isSearchScheduled = false;
      setSearchText(read());
    },
    { timeout: SEARCH_IDLE_TIMEOUT_MS },
  );
}

/** "ab" with a bracket under it, as the whole word button looks in VS Code */
const WholeWordIcon = () => (
  <span class="relative inline-block px-px">
    ab
    <span class="absolute -inset-x-px bottom-px h-0.75 border-x border-b border-current" />
  </span>
);

const toggles: Array<{ option: keyof SearchOptions; label: () => JSX.Element; title: string }> = [
  { option: 'caseSensitive', label: () => 'Aa', title: 'Match case' },
  { option: 'wholeWord', label: WholeWordIcon, title: 'Match whole word' },
  { option: 'regex', label: () => '.*', title: 'Regular expression' },
];

interface Props {
  layout: FilterLayout;
}

/** The search text and how to read it. With the filters along the top, the button for the layout of the filters is here */
export function SearchBar(props: Props) {
  const { error } = useSearch();
  let input: HTMLInputElement | undefined;

  // Also when the bar is made: the input has the focus when the page opens
  createEffect(getFocusRequests, () => {
    input?.focus();
    input?.select();
  });

  return (
    <div>
      {/* As high as the top of the icon sidebar, which can be beside it, so that the two line up */}
      <div class="flex h-12 items-center gap-1.5 border-b border-slate-700 px-1.5">
        <Show when={props.layout === 'top-bar'}>
          <LayoutToggle />
        </Show>
        <div class="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-md border border-slate-600 bg-slate-900 px-2 focus-within:border-sky-500">
          <input
            type="text"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Search state and passages…"
            spellcheck="false"
            autocomplete="off"
            ref={input}
            value={getSearchText()}
            onInput={() => setSearchTextWhenIdle(() => input?.value ?? '')}
          />
          <Show when={getSearchText()}>
            <button
              type="button"
              class="cursor-pointer px-1 text-slate-400 hover:text-white"
              title="Clear"
              onClick={() => setSearchText('')}
            >
              ✕
            </button>
          </Show>
          <For each={toggles}>
            {(toggle) => (
              <button
                type="button"
                class={clsx(
                  'cursor-pointer rounded-sm px-1.5 py-0.5 font-mono text-xs',
                  getOptions()[toggle.option]
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700',
                )}
                title={toggle.title}
                aria-pressed={getOptions()[toggle.option] ? 'true' : 'false'}
                onClick={() => toggleOption(toggle.option)}
              >
                {toggle.label()}
              </button>
            )}
          </For>
        </div>
      </div>
      <Show when={error()}>
        <p class="border-b border-slate-700 px-3 py-1 text-xs text-red-400">⚠ {error()}</p>
      </Show>
    </div>
  );
}
