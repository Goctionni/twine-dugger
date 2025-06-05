import { JSX, Show } from 'solid-js';
import { Tooltip } from './Tooltip';

interface Props {
  label: string;
  labelTooltip?: string;
  children: JSX.Element;
}

export function SettingsControl(props: Props) {
  return (
    <div class="mb-4">
      <label class="text-sm font-medium mb-2 flex items-center gap-2">
        <span>{props.label}</span>
        <Show when={props.labelTooltip}>
          <Tooltip text={props.labelTooltip!} />
        </Show>
      </label>
      {props.children}
    </div>
  );
}
