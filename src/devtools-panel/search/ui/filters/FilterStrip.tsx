import { For, Show } from 'solid-js';

import { filterGroups } from './filter-groups';
import { LayoutToggle } from './LayoutToggle';
import { Popover } from './Popover';

/** A narrow column of icons, each opening one group beside it */
export function FilterStrip() {
  return (
    <nav class="flex h-full w-12 shrink-0 flex-col items-center gap-1 border-r border-slate-700 py-2">
      <LayoutToggle />
      <For each={filterGroups}>
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
    </nav>
  );
}
