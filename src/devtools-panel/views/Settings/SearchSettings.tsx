import { For } from 'solid-js';

import { createGetSetting, setSetting } from '@/devtools-panel/store/store';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';

import { SettingControl } from './SettingControl';

const remembered = [
  { setting: 'search.persist.options', label: 'Remember match case, whole word and regex' },
  { setting: 'search.persist.scope', label: 'Remember what is searched in' },
  { setting: 'search.persist.sort', label: 'Remember the sort order' },
  { setting: 'search.persist.typeFilter', label: 'Remember the state type filter' },
] as const;

export function SearchSettings() {
  return (
    <For each={remembered}>
      {(item) => (
        <SettingControl label={item.label} noLabel>
          {(id) => (
            <BooleanInput
              value={createGetSetting(item.setting)()}
              onChange={(value) => setSetting(item.setting, value)}
              id={id}
            />
          )}
        </SettingControl>
      )}
    </For>
  );
}
