import { For } from 'solid-js';

import { getSettings, setSetting } from '@/devtools-panel/store/store';
import type { SplitDirection } from '@/devtools-panel/ui/util/movable-split/MovableSplit';

const directions: { value: SplitDirection; label: string }[] = [
  { value: 'auto', label: 'Auto (by the space available)' },
  { value: 'vertical', label: 'Vertical (stacked)' },
  { value: 'horizontal', label: 'Horizontal (side by side)' },
];

export const describeSplitDirection = (value: SplitDirection) =>
  directions.find((direction) => direction.value === value)!.label;

interface Props {
  setting: 'state.splitDirection' | 'passages.splitDirection';
  label: string;
}

export function SplitDirectionSelect(props: Props) {
  return (
    <select
      aria-label={props.label}
      class="min-w-64 cursor-pointer rounded-sm border border-slate-600 bg-slate-900 px-2 py-1"
      value={
        props.setting === 'state.splitDirection'
          ? getSettings.state.splitDirection()
          : getSettings.passages.splitDirection()
      }
      onChange={(event) => setSetting(props.setting, event.currentTarget.value as SplitDirection)}
    >
      <For each={directions}>
        {(direction) => <option value={direction.value}>{direction.label}</option>}
      </For>
    </select>
  );
}
