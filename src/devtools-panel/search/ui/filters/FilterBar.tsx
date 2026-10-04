import { For, Show } from 'solid-js';

import { filterGroups } from './filter-groups';
import { Popover } from './Popover';

/** A row of buttons under the query, each opening one group below it */
export function FilterBar() {
  return (
    <div class="flex flex-wrap items-center gap-1 border-b border-slate-700 px-2 py-1">
      <For each={filterGroups}>
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
