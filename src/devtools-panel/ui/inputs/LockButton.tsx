import { Match, Switch } from 'solid-js';

import type { LockStatus } from '@/shared/shared-types';

interface LockButtonProps {
  status: LockStatus;
  onToggle: () => void;
  /** Cannot be pressed, for the reason that `disabledTitle` gives */
  disabled?: boolean;
  disabledTitle?: string;
}

/** Locks a value at what it is, or unlocks it. A lock of a parent is not for this button to undo */
export function LockButton(props: LockButtonProps) {
  return (
    <Switch>
      <Match when={props.status === 'ancestor-lock'}>
        <span class="flex items-center text-slate-300">Ancestor locked</span>
      </Match>
      <Match when={props.status !== 'ancestor-lock'}>
        <button
          type="button"
          aria-label="Lock"
          aria-pressed={props.status === 'locked' ? 'true' : 'false'}
          disabled={props.disabled}
          title={
            props.disabled
              ? props.disabledTitle
              : props.status === 'locked'
                ? 'Unlock this value'
                : 'Lock this value'
          }
          class={[
            'inline-flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border',
            props.status === 'locked'
              ? 'border-sky-500 bg-sky-950 text-sky-300'
              : 'border-gray-500 text-gray-300 hover:bg-gray-700',
            'disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent',
          ]}
          onClick={() => props.onToggle()}
        >
          <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
            {props.status === 'locked' ? 'lock' : 'lock_open'}
          </span>
        </button>
      </Match>
    </Switch>
  );
}
