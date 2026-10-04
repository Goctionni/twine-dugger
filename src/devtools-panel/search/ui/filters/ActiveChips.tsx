import { For, Show } from 'solid-js';

import { getActiveFilters } from '../../model/active-filters';
import { resetFilters } from '../../model/search-state';

/** What is not how it starts out, each with a button to take it away */
export function ActiveChips() {
  return (
    <Show when={getActiveFilters().length}>
      <div class="flex flex-wrap items-center gap-1 border-b border-slate-700 px-2 py-1">
        <For each={getActiveFilters()} keyed={(filter) => filter.id}>
          {(filter) => (
            <button
              type="button"
              class="cursor-pointer rounded-full bg-sky-900 px-2 py-0.5 text-xs hover:bg-sky-800"
              title="Take away"
              onClick={() => filter().remove()}
            >
              {filter().label} ✕
            </button>
          )}
        </For>
        <button
          type="button"
          class="cursor-pointer rounded-full px-2 py-0.5 text-xs text-sky-400 hover:bg-slate-700"
          onClick={() => resetFilters()}
        >
          Reset all
        </button>
      </div>
    </Show>
  );
}
