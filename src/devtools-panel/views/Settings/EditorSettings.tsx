import { For } from 'solid-js';

import { createGetSetting, setSetting } from '@/devtools-panel/store/store';
import { describeLimit, highlightingLimits } from '@/devtools-panel/ui/code/highlighting-limits';
import type { HighlightingLimit } from '@/devtools-panel/ui/code/highlighting-limits';

import { SettingControl } from './SettingControl';

const getDisableHighlighting = createGetSetting('editor.disableHighlighting');

export function EditorSettings() {
  return (
    <SettingControl label="Disable immediate syntax highlighting">
      {(id) => (
        <select
          id={id}
          class="w-64 cursor-pointer rounded-sm border border-slate-600 bg-slate-900 px-2 py-1"
          value={getDisableHighlighting()}
          onChange={(event) =>
            setSetting('editor.disableHighlighting', event.currentTarget.value as HighlightingLimit)
          }
        >
          <For each={highlightingLimits}>
            {(limit) => <option value={limit.value}>{describeLimit(limit)}</option>}
          </For>
        </select>
      )}
    </SettingControl>
  );
}
