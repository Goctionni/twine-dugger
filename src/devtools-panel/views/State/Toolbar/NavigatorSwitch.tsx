import { Show } from 'solid-js';

import type { Navigator } from '../types';
import { toolbarControl } from './toolbarControl';

export type NavigatorSwitchVariant = 'minimal' | 'labels';

interface Props {
  variant: NavigatorSwitchVariant;
  navigator: Navigator;
  onChange: (navigator: Navigator) => void;
}

export function NavigatorSwitch(props: Props) {
  const showLabels = () => props.variant === 'labels';

  return (
    <div
      role="group"
      aria-label="Navigator"
      class={[toolbarControl, 'inline-flex shrink-0 overflow-hidden']}
    >
      <SwitchButton
        icon="view_column"
        label="Miller"
        showLabel={showLabels()}
        isActive={props.navigator === 'miller'}
        onClick={() => props.onChange('miller')}
      />
      <SwitchButton
        icon="account_tree"
        label="Tree"
        showLabel={showLabels()}
        isActive={props.navigator === 'tree'}
        onClick={() => props.onChange('tree')}
      />
      <SwitchButton
        icon="grid_view"
        label="Tiles"
        showLabel={showLabels()}
        isActive={props.navigator === 'tiles'}
        onClick={() => props.onChange('tiles')}
      />
    </div>
  );
}

interface SwitchButtonProps {
  icon: string;
  label: string;
  showLabel: boolean;
  isActive: boolean;
  onClick: () => void;
}

function SwitchButton(props: SwitchButtonProps) {
  return (
    <button
      type="button"
      class={[
        'inline-flex cursor-pointer items-center gap-1 px-2',
        props.isActive ? 'bg-sky-700 text-white' : 'text-gray-300 hover:bg-gray-700',
      ]}
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.isActive ? 'true' : 'false'}
      onClick={() => props.onClick()}
    >
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        {props.icon}
      </span>
      <Show when={props.showLabel}>
        <span class="[text-box:trim-both_ex_alphabetic]">{props.label}</span>
      </Show>
    </button>
  );
}
