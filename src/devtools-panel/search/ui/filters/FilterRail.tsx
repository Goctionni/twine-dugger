import { For, Show } from 'solid-js';

import { getFilterCounts } from '../../model/active-filters';
import { resetFilters } from '../../model/search-state';
import { filterGroups } from './filter-groups';

/** All the filters, one under the other, for when there is room */
export function FilterRail() {
  const anySet = () => Object.values(getFilterCounts()).some(Boolean);

  return (
    <aside class="flex h-full w-56 shrink-0 flex-col gap-3 overflow-auto border-r border-slate-700 p-2">
      <For each={filterGroups}>
        {(group) => (
          <section>
            <h3 class="mb-1 px-1 text-xs font-semibold tracking-wide text-slate-300 uppercase">
              {group.title}
              <Show when={group.count()}>
                <span class="ml-1 rounded-full bg-sky-600 px-1.5 text-white">{group.count()}</span>
              </Show>
            </h3>
            <group.Body />
          </section>
        )}
      </For>
      <Show when={anySet()}>
        <button
          type="button"
          class="cursor-pointer self-start rounded-sm px-2 py-1 text-xs text-sky-400 hover:bg-slate-700"
          onClick={() => resetFilters()}
        >
          Reset filters
        </button>
      </Show>
    </aside>
  );
}
