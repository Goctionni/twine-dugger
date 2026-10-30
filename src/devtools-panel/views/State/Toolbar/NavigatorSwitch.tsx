import type { Navigator } from '../types';
import { toolbarControl } from './toolbarControl';

export type NavigatorSwitchVariant = 'minimal' | 'labels';

interface Props {
  variant: NavigatorSwitchVariant;
  navigator: Navigator;
  onChange: (navigator: Navigator) => void;
}

export function NavigatorSwitch(props: Props) {
  const name = `navigator-${crypto.randomUUID()}`;
  const showLabels = () => props.variant === 'labels';

  return (
    <fieldset class={[toolbarControl, 'inline-flex shrink-0 overflow-hidden']}>
      <legend class="sr-only">Navigator</legend>
      <SwitchOption
        name={name}
        icon="view_column"
        label="Miller"
        showLabel={showLabels()}
        isChecked={props.navigator === 'miller'}
        onSelect={() => props.onChange('miller')}
      />
      <SwitchOption
        name={name}
        icon="account_tree"
        label="Tree"
        showLabel={showLabels()}
        isChecked={props.navigator === 'tree'}
        onSelect={() => props.onChange('tree')}
      />
      <SwitchOption
        name={name}
        icon="grid_view"
        label="Tiles"
        showLabel={showLabels()}
        isChecked={props.navigator === 'tiles'}
        onSelect={() => props.onChange('tiles')}
      />
    </fieldset>
  );
}

interface SwitchOptionProps {
  name: string;
  icon: string;
  label: string;
  showLabel: boolean;
  isChecked: boolean;
  onSelect: () => void;
}

function SwitchOption(props: SwitchOptionProps) {
  return (
    <label
      title={props.label}
      class="inline-flex cursor-pointer items-center gap-1 px-2 text-gray-300 not-has-checked:hover:bg-gray-700 has-checked:bg-sky-700 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-sky-300"
    >
      <input
        type="radio"
        name={props.name}
        class="sr-only"
        checked={props.isChecked}
        onChange={() => props.onSelect()}
      />
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        {props.icon}
      </span>
      <span class={props.showLabel ? '[text-box:trim-both_ex_alphabetic]' : 'sr-only'}>
        {props.label}
      </span>
    </label>
  );
}
