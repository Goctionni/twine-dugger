import clsx from 'clsx';
import { Match, Switch } from 'solid-js';

import { LockStatus } from '@/shared/shared-types';

interface LockButtonProps {
  status: LockStatus;
  onToggle: () => void;
}

const outlinedButtonClasses =
  'py-1 cursor-pointer shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

export function LockButton(props: LockButtonProps) {
  return (
    <Switch>
      <Match when={props.status === 'locked'}>
        <button
          type="button"
          onClick={() => props.onToggle()}
          class={clsx(
            outlinedButtonClasses,
            'min-w-16 text-white px-4 rounded-md -outline-offset-2 outline-2 outline-gray-500 hover:outline-transparent hover:bg-sky-700 focus:ring-sky-500'
          )}
        >
          Unlock
        </button>
      </Match>
      <Match when={props.status === 'unlocked'}>
        <button
          type="button"
          onClick={() => props.onToggle()}
          class={clsx(
            outlinedButtonClasses,
            'min-w-16 text-white px-4 rounded-md -outline-offset-2 outline-2 outline-gray-500 hover:outline-transparent hover:bg-sky-700 focus:ring-sky-500'
          )}
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
