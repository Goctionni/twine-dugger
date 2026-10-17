import { For } from 'solid-js';

import type { MockColumn } from '../mock-state';
import { NavRow } from './NavRow';

interface Props {
  column: MockColumn;
  /** Which column it is: the entry of the selected path that is in it is at this position */
  depth: number;
  path: string[];
  onSelect: (path: string[]) => void;
}

export function MillerColumn(props: Props) {
  const getRowState = (key: string) => {
    if (props.path[props.depth] !== key) return 'normal';
    return props.depth === props.path.length - 1 ? 'selected' : 'on-path';
  };

  return (
    <div class="min-w-57.5 flex-1 basis-57.5 overflow-y-auto border-r border-gray-700 p-1 not-last:max-w-86.25 last:border-r-0">
      <div class="sticky top-0 truncate bg-gray-900 px-2 py-1 font-mono text-xs text-gray-400">
        {props.column.key}
      </div>
      <For each={props.column.entries}>
        {(entry) => (
          <NavRow
            name={entry.key}
            type={entry.type}
            preview={entry.preview}
            childCount={entry.childCount}
            state={getRowState(entry.key)}
            onClick={() => props.onSelect([...props.column.path, entry.key])}
          />
        )}
      </For>
    </div>
  );
}
