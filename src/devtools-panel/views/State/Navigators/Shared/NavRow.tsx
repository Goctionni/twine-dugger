import { Match, Switch } from 'solid-js';

import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import type { ValueType } from '@/shared/shared-types';

import { ChildCount } from './ChildCount';

interface Props {
  id: string;
  level: number;
  isExpanded?: boolean;
  name: string;
  type: ValueType;
  preview?: string;
  childCount?: number;
  hiddenCount?: number;
  state: 'selected' | 'on-path' | 'trail' | 'normal';
  onClick: () => void;
}

/** Not a button: it is never focused. The tree has the focus, and tells which row is active */
export function NavRow(props: Props) {
  return (
    <div
      id={props.id}
      role="treeitem"
      aria-level={props.level}
      aria-selected={props.state === 'selected' ? 'true' : 'false'}
      aria-expanded={
        props.isExpanded === undefined ? undefined : props.isExpanded ? 'true' : 'false'
      }
      data-state={props.state}
      class={[
        // The margin keeps a row that is scrolled into view from ending up under the sticky header of the column
        'flex w-full cursor-pointer scroll-mt-8 items-center gap-2 rounded-md border px-2 py-1 text-left text-sm select-none',
        props.state === 'selected' && 'border-sky-500 bg-sky-950',
        props.state === 'on-path' && 'border-transparent bg-slate-800',
        props.state === 'trail' && 'border-dashed border-sky-500 bg-sky-950/40',
        props.state === 'normal' && 'border-transparent hover:bg-gray-800',
      ]}
      onClick={() => props.onClick()}
    >
      <TypeIcon type={props.type} />
      <span class="max-w-[60%] shrink-0 truncate">{props.name}</span>
      <Switch>
        <Match when={props.childCount !== undefined}>
          <ChildCount
            count={props.childCount!}
            hiddenCount={props.hiddenCount ?? 0}
            isSelected={props.state === 'selected'}
          />
        </Match>
        <Match when={props.childCount === undefined}>
          <span class="min-w-0 truncate font-mono text-xs text-gray-400">{props.preview}</span>
        </Match>
      </Switch>
    </div>
  );
}
