import { createEffect, createSignal, onSettled, Show } from 'solid-js';

import { getSettings, setSetting } from '../../../store/store';
import type { Matcher, SearchOptions } from '../../core/types';
import type { FilterLayout } from '../../types';
import { LayoutToggle } from '../filters/LayoutToggle';
import { createMatcher } from './matcher';
import { ToggleCaseSensitive, ToggleRegex, ToggleWholeWord } from './OptionToggles';
import {
  getSearchOptions,
  getSearchText,
  setSearchOptions,
  setSearchText,
  whenIdle,
} from './search-query';

const [getFocusRequests, setFocusRequests] = createSignal(0);

export const requestSearchFocus = () => setFocusRequests((count) => count + 1);

interface Props {
  layout: FilterLayout;
  setMatcher: (matcher: Matcher | null) => void;
}

export function SearchBar(props: Props) {
  let input: HTMLInputElement | undefined;
  createEffect(getFocusRequests, () => {
    input?.focus();
    input?.select();
  });

  // Why the search text can't be searched for (an invalid regex), if so
  const [getError, setError] = createSignal<string | null>(null);

  /** Gives the matcher for what is searched for, and says why there is none when it is not valid */
  function search(searchText: string, options: SearchOptions) {
    const result = searchText ? createMatcher({ searchText, options }) : null;
    setError(result && !result.ok ? result.error : null);
    props.setMatcher(result?.ok ? result.matcher : null);
  }

  // The page starts without a matcher, and what was searched for is still here after leaving it
  onSettled(() => search(getSearchText(), getSearchOptions()));

  // When SearchOptions changes, store them (if the user wants them stored)
  createEffect(
    () => (getSettings.search.persist.options() ? getSearchOptions() : undefined),
    (options) => {
      if (options) setSetting('search.saved.options', { ...options });
    },
  );

  const toggleOption = (option: keyof SearchOptions) => {
    search(
      getSearchText(),
      setSearchOptions((prev) => ({ ...prev, [option]: !prev[option] })),
    );
  };

  return (
    <div>
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
            onInput={(event) =>
              whenIdle(() => search(setSearchText(event.target.value), getSearchOptions()))
            }
          />
          <Show when={getSearchText()}>
            <button
              type="button"
              class="cursor-pointer px-1 text-slate-400 hover:text-white"
              title="Clear"
              onClick={() => search(setSearchText(''), getSearchOptions())}
            >
              ✕
            </button>
          </Show>
          <ToggleCaseSensitive
            active={getSearchOptions().caseSensitive}
            onToggle={() => toggleOption('caseSensitive')}
          />
          <ToggleWholeWord
            active={getSearchOptions().wholeWord}
            onToggle={() => toggleOption('wholeWord')}
          />
          <ToggleRegex active={getSearchOptions().regex} onToggle={() => toggleOption('regex')} />
        </div>
      </div>
      <Show when={getError()}>
        <p class="border-b border-slate-700 px-3 py-1 text-xs text-red-400">⚠ {getError()}</p>
      </Show>
    </div>
  );
}
