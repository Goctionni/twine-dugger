import clsx from 'clsx';
import { Match, Switch } from 'solid-js';

import { LockStatus } from '@/shared/shared-types';

import { btnClass } from '../util/btnClass';

interface LockButtonProps {
  status: LockStatus;
  onToggle: () => void;
}

export function LockButton(props: LockButtonProps) {
  return (
    <Switch>
      <Match when={props.status === 'locked'}>
        <button
          type="button"
          onClick={() => props.onToggle()}
          class={btnClass('clr-gray hover:clr-sky min-w-16')}
        >
          Unlock
        </button>
      </Match>
      <Match when={props.status === 'unlocked'}>
        <button
          type="button"
          onClick={() => props.onToggle()}
          class={btnClass('clr-gray hover:clr-sky min-w-16')}
        >
          Lock
        </button>
      </Match>
      <Match when={props.status === 'ancestor-lock'}>
        <span class="flex items-center text-slate-300">Ancestor locked</span>
      </Match>
    </Switch>
  );
}
