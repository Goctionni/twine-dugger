import { createGetSetting, setSetting } from '@/devtools-panel/store/store';

import { SettingControl } from './SettingControl';

const getSyntaxHighlighting = createGetSetting('editor.syntaxHighlighting');

export function EditorSettings() {
  return (
    <SettingControl label="Syntax highlighting">
      {(id) => (
        <select
          id={id}
          class="w-46 cursor-pointer rounded-sm border border-slate-600 bg-slate-900 px-2 py-1"
          value={getSyntaxHighlighting()}
          onChange={(event) =>
            setSetting(
              'editor.syntaxHighlighting',
              event.currentTarget.value as 'always' | 'small' | 'never',
            )
          }
        >
          <option value="always">Always</option>
          <option value="small">Small passages</option>
          <option value="never">Never</option>
        </select>
      )}
    </SettingControl>
  );
}
