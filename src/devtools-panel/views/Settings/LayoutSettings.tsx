import { For } from 'solid-js';

import { getSettings, setSetting } from '@/devtools-panel/store/store';
import type { SplitDirection } from '@/devtools-panel/ui/util/movable-split/MovableSplit';

import { NumberInput } from '../../ui/inputs/NumberInput';
import { onRecentUpdatesChange } from './diffLogSetters';
import { SettingControl } from './SettingControl';

const directions: { value: SplitDirection; label: string }[] = [
  { value: 'auto', label: 'Auto (by the space available)' },
  { value: 'vertical', label: 'Vertical (stacked)' },
  { value: 'horizontal', label: 'Horizontal (side by side)' },
];

export function LayoutSettings() {
  return (
    <>
      <SettingControl label="State page: split direction">
        {(id) => (
          <select
            id={id}
            class="w-64 cursor-pointer rounded-sm border border-slate-600 bg-slate-900 px-2 py-1"
            value={getSettings.state.splitDirection()}
            onChange={(event) =>
              setSetting('state.splitDirection', event.currentTarget.value as SplitDirection)
            }
          >
            <For each={directions}>
              {(direction) => <option value={direction.value}>{direction.label}</option>}
            </For>
          </select>
        )}
      </SettingControl>
      <SettingControl label="State page: dot for changes in the last (updates)">
        {(id) => (
          <NumberInput
            inputProps={{ id }}
            value={getSettings.state.recentUpdates()}
            onChange={onRecentUpdatesChange}
          />
        )}
      </SettingControl>
      <SettingControl label="Passages page: split direction">
        {(id) => (
          <select
            id={id}
            class="w-64 cursor-pointer rounded-sm border border-slate-600 bg-slate-900 px-2 py-1"
            value={getSettings.passages.splitDirection()}
            onChange={(event) =>
              setSetting('passages.splitDirection', event.currentTarget.value as SplitDirection)
            }
          >
            <For each={directions}>
              {(direction) => <option value={direction.value}>{direction.label}</option>}
            </For>
          </select>
        )}
      </SettingControl>
    </>
  );
}
