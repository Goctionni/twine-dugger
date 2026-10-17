import type { JSX } from '@solidjs/web';

import type { Navigator } from '../types';

interface Props {
  navigator: Navigator;
  onChange: (navigator: Navigator) => void;
}

export function NavigatorSwitch(props: Props) {
  return (
    <div
      role="group"
      aria-label="Navigator"
      class="inline-flex overflow-hidden rounded-lg border border-gray-500"
    >
      <SwitchButton
        icon="view_column"
        isActive={props.navigator === 'miller'}
        onClick={() => props.onChange('miller')}
      >
        Miller
      </SwitchButton>
      <SwitchButton
        icon="account_tree"
        isActive={props.navigator === 'tree'}
        onClick={() => props.onChange('tree')}
      >
        Tree
      </SwitchButton>
      <SwitchButton
        icon="grid_view"
        isActive={props.navigator === 'tiles'}
        onClick={() => props.onChange('tiles')}
      >
        Tiles
      </SwitchButton>
    </div>
  );
}

interface SwitchButtonProps {
  icon: string;
  isActive: boolean;
  onClick: () => void;
  children: JSX.Element;
}

function SwitchButton(props: SwitchButtonProps) {
  return (
    <button
      type="button"
      class={[
        'inline-flex cursor-pointer items-center gap-1 px-2 py-1 text-sm',
        props.isActive ? 'bg-sky-700 text-white' : 'text-gray-300 hover:bg-gray-700',
      ]}
      aria-pressed={props.isActive ? 'true' : 'false'}
      onClick={() => props.onClick()}
    >
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        {props.icon}
      </span>
      <span class="[text-box:trim-both_ex_alphabetic]">{props.children}</span>
    </button>
  );
}
