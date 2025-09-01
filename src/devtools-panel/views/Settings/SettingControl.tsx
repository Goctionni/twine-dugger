import { JSX, Match, Switch } from 'solid-js';

interface SettingControlProps {
  label: string;
  noLabel?: boolean;
  children: (id: string) => JSX.Element;
}

export function SettingControl(props: SettingControlProps) {
  const id = () =>
    `${props.label.toLowerCase().replace(/[^a-z0-9]/, '')}-${Math.random().toString(36).slice(2)}`;

  const className = 'col-span-full grid grid-cols-subgrid items-center py-1';

  return (
    <Switch>
      <Match when={props.noLabel}>
        <div class={className}>
          <span class="inline-block w-50">{props.label}</span>
          {props.children(id())}
        </div>
      </Match>
      <Match when={!props.noLabel}>
        <label class={className} for={id()}>
          <span>{props.label}</span>
          {props.children(id())}
        </label>
      </Match>
    </Switch>
  );
}
