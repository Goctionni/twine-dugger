import { Match, Switch } from 'solid-js';

interface Props {
  /** Without the values that the filter hides */
  count: number;
  hiddenCount: number;
  isSelected: boolean;
}

export function ChildCount(props: Props) {
  const isEmpty = () => props.count === 0 && props.hiddenCount === 0 && props.isSelected;

  return (
    <Switch>
      {/* Only for the selected container: an empty one that is not selected is just a 0 */}
      <Match when={isEmpty()}>
        <span
          class="shrink-0 font-mono text-[11px] font-bold tracking-wide text-red-400"
          title="Contains 0 values"
        >
          EMPTY
        </span>
      </Match>
      <Match when={!isEmpty()}>
        <span
          class={[
            'shrink-0 font-mono text-[11px]',
            props.hiddenCount > 0 ? 'text-amber-400' : 'text-gray-500',
          ]}
          title={`Contains ${props.count} ${props.count === 1 ? 'value' : 'values'}${props.hiddenCount > 0 ? ` (${props.hiddenCount} hidden)` : ''}`}
        >
          {props.count} ›
        </span>
      </Match>
    </Switch>
  );
}
