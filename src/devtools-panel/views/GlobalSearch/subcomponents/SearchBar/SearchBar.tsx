import { createEffect, createSignal, onSettled, Show } from 'solid-js';

import { createQueryMatcher } from '../../logic/query-matcher';
import { getFocusRequests } from '../../store-helpers/search-focus';
import {
  getSearchOptions,
  getSearchText,
  setSearchOptions,
  setSearchText,
} from '../../store-helpers/search-input';
import type { FilterLayout, QueryMatcher, SearchOptions } from '../../types';
import { LayoutToggle } from '../Filters/LayoutToggle';
import { ToggleCaseSensitive, ToggleRegex, ToggleWholeWord } from './OptionToggles';
import { whenIdle } from './when-idle';

interface Props {
  layout: FilterLayout;
  setQueryMatcher: (queryMatcher: QueryMatcher | null) => void;
}

export function SearchBar(props: Props) {
  let input: HTMLInputElement | undefined;
  createEffect(getFocusRequests, () => {
    input?.focus();
    input?.select();
  });

  // Why the search text can't be searched for (an invalid regex), if so
  const [getError, setError] = createSignal<string | null>(null);

  /** Gives the query matcher for what is searched for, and says why there is none when it is not valid */
  function search(searchText: string, options: SearchOptions) {
    const result = searchText ? createQueryMatcher(searchText, options) : null;
    setError(result && !result.ok ? result.error : null);
    props.setQueryMatcher(result?.ok ? result.queryMatcher : null);
  }

  // The page starts without a query matcher, and what was searched for is still here after leaving it
  onSettled(() => search(getSearchText(), getSearchOptions()));

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
