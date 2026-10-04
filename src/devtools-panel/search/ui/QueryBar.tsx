import clsx from 'clsx';
import { For, Show } from 'solid-js';

import type { SearchOptions } from '../core/types';
import { useSearch } from '../model/context';
import { getOptions, getQuery, setQuery, toggleOption } from '../model/search-state';
import { LayoutToggle } from './filters/LayoutToggle';

const toggles: Array<{ option: keyof SearchOptions; label: string; title: string }> = [
  { option: 'caseSensitive', label: 'Aa', title: 'Match case' },
  { option: 'wholeWord', label: 'ab|', title: 'Match whole word' },
  { option: 'regex', label: '.*', title: 'Regular expression' },
];

interface Props {
  /** Whether the filters are a bar: the button to change how they show is then here, not in the strip */
  showLayoutToggle: boolean;
}

export function QueryBar(props: Props) {
  const { error } = useSearch();

  return (
    <div class="border-b border-slate-700 p-2">
      <div class="flex items-center gap-2">
        <Show when={props.showLayoutToggle}>
          <LayoutToggle />
        </Show>
        <div class="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-slate-600 bg-slate-900 px-2 focus-within:border-sky-500">
          <input
            type="text"
            class="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
            placeholder="Search state and passages…"
            spellcheck="false"
            autocomplete="off"
            autofocus
            value={getQuery()}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
          <Show when={getQuery()}>
            <button
              type="button"
              class="cursor-pointer px-1 text-slate-400 hover:text-white"
              title="Clear"
              onClick={() => setQuery('')}
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
                {toggle.label}
              </button>
            )}
          </For>
        </div>
      </div>
      <Show when={error()}>
        <p class="mt-1 px-1 text-xs text-red-400">⚠ {error()}</p>
      </Show>
    </div>
  );
}
