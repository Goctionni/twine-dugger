import clsx from 'clsx';
import { For, JSX } from 'solid-js';

import { Tag } from '@/devtools-panel/ui/display/Tag';
import { ParsedPassageData } from '@/shared/shared-types';

interface ListItemProps {
  passageData: ParsedPassageData;
  onClick: () => void;
  active?: boolean;
  style?: JSX.CSSProperties | undefined;
}

export function PassageListItem(props: ListItemProps) {
  return (
    <li class="flex border-t border-slate-400 last:border-b" style={props.style}>
      <button
        data-id={props.passageData.id}
        data-name={props.passageData.name}
        type="button"
        onClick={() => props.onClick()}
        class={clsx(
          'flex flex-1 cursor-pointer items-start gap-2 overflow-hidden px-4 py-2 hover:bg-slate-600',
          { 'bg-slate-700': props.active },
        )}
      >
        <span class="flex-1 overflow-hidden text-left font-mono text-ellipsis whitespace-nowrap">
          {props.passageData.name}
        </span>
        <div class="flex gap-1">
          <For each={props.passageData.tags}>{(tag) => <Tag tag={tag} />}</For>
        </div>
      </button>
    </li>
  );
}
