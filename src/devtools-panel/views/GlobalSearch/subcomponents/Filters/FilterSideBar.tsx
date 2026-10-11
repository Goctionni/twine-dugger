import { For, Match, Show, Switch } from 'solid-js';

import { hasActiveFilters, resetFilters } from '../../store-helpers/search-state';
import type { FilterLayout } from '../../types';
import { createFilterGroups, type FilterCounts, type FilterGroup } from './filter-groups';
import { LayoutToggle } from './LayoutToggle';
import { Popover } from './Popover';

interface Props extends FilterCounts {
  layout: FilterLayout;
}

export function FilterSideBar(props: Props) {
  const groups = createFilterGroups(props);
  return (
    <Switch>
      <Match when={props.layout === 'icon-sidebar'}>
        <IconSideBar groups={groups} />
      </Match>
      <Match when={props.layout === 'full-sidebar'}>
        <FullSideBar groups={groups} />
      </Match>
    </Switch>
  );
}

/** All the filters, one under the other, for when there is room */
function FullSideBar(props: { groups: FilterGroup[] }) {
  return (
    <aside class="flex h-full w-56 shrink-0 flex-col gap-3 overflow-auto border-r border-slate-700 p-1.5">
      <For each={props.groups}>
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
      <Show when={hasActiveFilters()}>
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

/** A narrow column of icons, each opening one group beside it */
function IconSideBar(props: { groups: FilterGroup[] }) {
  return (
    <nav class="box-content flex h-full w-12 shrink-0 flex-col items-center border-r border-slate-700">
      {/* As high as the search bar, which is beside it, so that the button lines up with it */}
      <div class="flex h-12 w-full shrink-0 items-center justify-center border-b border-slate-700">
        <LayoutToggle />
      </div>
      <div class="flex flex-col items-center gap-1.5 py-1.5">
        <For each={props.groups}>
          {(group) => (
            <Popover
              side="right"
              label={group.title}
              active={group.count() > 0}
              triggerClass="relative flex size-9 items-center justify-center font-mono text-base"
              trigger={
                <>
                  <span aria-hidden="true">{group.icon}</span>
                  <Show when={group.count()}>
                    <span class="absolute -top-0.5 -right-0.5 rounded-full bg-sky-600 px-1 text-[10px] text-white">
                      {group.count()}
                    </span>
                  </Show>
                </>
              }
            >
              <h3 class="mb-1 text-xs font-semibold tracking-wide text-slate-300 uppercase">
                {group.title}
              </h3>
              <group.Body />
            </Popover>
          )}
        </For>
      </div>
    </nav>
  );
}
