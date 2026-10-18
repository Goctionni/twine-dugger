import { For } from 'solid-js';

import { getSettings, setSetting } from '@/devtools-panel/store/store';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';

import { SettingControl } from './SettingControl';

const remembered = [
  { setting: 'options', label: 'Remember match case, whole word and regex' },
  { setting: 'scope', label: 'Remember what is searched in' },
  { setting: 'sort', label: 'Remember the sort order' },
  { setting: 'typeFilter', label: 'Remember the state type filter' },
] as const;

export function SearchSettings() {
  return (
    <For each={remembered}>
      {(item) => (
        <SettingControl label={item.label} noLabel>
          {(id) => (
            <BooleanInput
              value={getSettings.search.persist[item.setting]()}
              onChange={(value) => setSetting(`search.persist.${item.setting}`, value)}
              id={id}
              label={item.label}
            />
          )}
        </SettingControl>
      )}
    </For>
  );
}
