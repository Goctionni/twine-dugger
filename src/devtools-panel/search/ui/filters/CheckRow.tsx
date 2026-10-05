import type { JSX } from '@solidjs/web';
import { Show } from 'solid-js';

interface Props {
  checked: boolean;
  onChange: () => void;
  count?: number;
  children: JSX.Element;
}

/** A line of a filter list: a box, a label and optionally how many results it has */
export function CheckRow(props: Props) {
  return (
    <label class="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 text-sm hover:bg-slate-700">
      <input
        type="checkbox"
        class="size-3.5 cursor-pointer accent-sky-500"
        checked={props.checked}
        onChange={() => props.onChange()}
      />
      <span class="flex min-w-0 flex-1 items-center gap-1 truncate">{props.children}</span>
      <Show when={props.count !== undefined}>
        <span class="text-xs text-slate-400 tabular-nums">{props.count}</span>
      </Show>
    </label>
  );
}
