import { Match, Switch } from 'solid-js';

interface Props {
  count: number;
  isSelected: boolean;
}

export function ChildCount(props: Props) {
  return (
    <Switch>
      {/* Only for the selected container: an empty one that is not selected is just a 0 */}
      <Match when={props.count === 0 && props.isSelected}>
        <span
          class="shrink-0 font-mono text-[11px] font-bold tracking-wide text-red-400"
          title="Contains 0 values"
        >
          EMPTY
        </span>
      </Match>
      <Match when={!(props.count === 0 && props.isSelected)}>
        <span
          class="shrink-0 font-mono text-[11px] text-gray-500"
          title={`Contains ${props.count} ${props.count === 1 ? 'value' : 'values'}`}
        >
          {props.count} ›
        </span>
      </Match>
    </Switch>
  );
}
