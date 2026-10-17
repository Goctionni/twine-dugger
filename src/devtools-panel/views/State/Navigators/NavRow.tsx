import { Match, Switch } from 'solid-js';

import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import type { ValueType } from '@/shared/shared-types';

import { ChildCount } from './ChildCount';

interface Props {
  name: string;
  type: ValueType;
  /** Of a primitive */
  preview?: string;
  /** Of a container */
  childCount?: number;
  state: 'selected' | 'on-path' | 'normal';
  onClick: () => void;
}

export function NavRow(props: Props) {
  return (
    <button
      type="button"
      class={[
        'flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-left text-sm',
        props.state === 'selected' && 'border-sky-500 bg-sky-950',
        props.state === 'on-path' && 'border-transparent bg-slate-800',
        props.state === 'normal' && 'border-transparent hover:bg-gray-800',
      ]}
      onClick={() => props.onClick()}
    >
      <TypeIcon type={props.type} />
      <span class="max-w-[60%] shrink-0 truncate">{props.name}</span>
      <Switch>
        <Match when={props.childCount !== undefined}>
          <ChildCount count={props.childCount!} isSelected={props.state === 'selected'} />
        </Match>
        <Match when={props.childCount === undefined}>
          <span class="min-w-0 truncate font-mono text-xs text-gray-400">{props.preview}</span>
        </Match>
      </Switch>
    </button>
  );
}
