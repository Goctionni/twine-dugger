import { Match, Switch } from 'solid-js';

import type { LockStatus } from '@/shared/shared-types';

interface LockButtonProps {
  status: LockStatus;
  onToggle: () => void;
  disabled?: boolean;
  disabledTitle?: string;
  tabindex?: number;
}

export function LockButton(props: LockButtonProps) {
  const getTitle = () => {
    if (props.disabled) return props.disabledTitle;
    if (props.status === 'locked') return 'Unlock this value';
    return 'Lock this value';
  };
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
          tabindex={props.tabindex}
          title={getTitle()}
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
