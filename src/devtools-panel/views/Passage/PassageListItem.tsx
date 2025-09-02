import clsx from 'clsx';
import { For } from 'solid-js';

import { Tag } from '@/devtools-panel/ui/display/Tag';
import { ParsedPassageData } from '@/shared/shared-types';

interface ListItemProps {
  passageData: ParsedPassageData;
  onClick: () => void;
  active?: boolean;
}

export function PassageListItem(props: ListItemProps) {
  return (
    <li class="border-t last:border-b border-slate-400 flex">
      <button
        type="button"
        onClick={() => props.onClick()}
        class={clsx(
          'py-2 px-4 cursor-pointer hover:bg-slate-600 flex gap-2 flex-1 items-start overflow-hidden',
          { 'bg-slate-700': props.active },
        )}
      >
        <span class="flex-1 font-mono text-left overflow-hidden whitespace-nowrap text-ellipsis">
          {props.passageData.name}
        </span>
        <div class="flex gap-1">
          <For each={props.passageData.tags}>{(tag) => <Tag tag={tag} />}</For>
        </div>
      </button>
    </li>
  );
}
