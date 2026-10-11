import { For, Show } from 'solid-js';

import { createFilterGroups, type FilterCounts } from './filter-groups';
import { Popover } from './Popover';

/** A row of buttons under the search bar, each opening one group below it */
export function FilterTopBar(props: FilterCounts) {
  const groups = createFilterGroups(props);
  return (
    <div class="flex flex-wrap items-center gap-1.5 border-b border-slate-700 p-1.5">
      <For each={groups}>
        {(group) => (
          <Popover
            side="below"
            label={group.title}
            active={group.count() > 0}
            triggerClass="px-2 py-1 text-sm"
            trigger={
              <>
                {group.title}
                <Show when={group.count()}> · {group.count()}</Show> ▾
              </>
            }
          >
            <group.Body />
          </Popover>
        )}
      </For>
    </div>
  );
}
