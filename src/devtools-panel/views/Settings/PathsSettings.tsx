import { getSettings, setSetting } from '@/devtools-panel/store/store';
import { SegmentedInput } from '@/devtools-panel/ui/inputs/SegmentedInput';

import { FilteredPathsSettings } from './util/FilteredPathsSettings';
import { LockSettings } from './util/LockSettings';
import { SettingRow } from './util/SettingRow';

type HiddenIn = ReturnType<typeof getSettings.filteredPaths.hiddenIn>;

const options: { value: HiddenIn; label: string }[] = [
  { value: 'diff-log', label: 'Diff log' },
  { value: 'state', label: 'State page' },
  { value: 'both', label: 'Both' },
];

export function PathsSettings() {
  return (
    <>
      <SettingRow
        label="Hide filtered paths in"
        description="Where the filtered paths are left out."
        setting="filteredPaths.hiddenIn"
        formatDefault={(value) => options.find((option) => option.value === value)!.label}
        info={{
          title: 'Hide filtered paths in',
          children: (
            <>
              <p>
                A path is filtered when you right-click it in the diff log. This chooses where the
                filtered paths are then left out.
              </p>
              <p>
                <b>Diff log</b>: not shown there, and their changes are not kept in the history of
                values.
              </p>
              <p>
                <b>State page</b>: not shown in the navigators (the inspector still shows them). The
                diff log shows and records them as usual.
              </p>
              <p>
                <b>Both</b>: left out of both.
              </p>
            </>
          ),
        }}
      >
        <SegmentedInput
          label="Hide filtered paths in"
          options={options}
          value={getSettings.filteredPaths.hiddenIn()}
          onChange={(value) => setSetting('filteredPaths.hiddenIn', value)}
        />
      </SettingRow>
      <div class="mt-4 flex flex-col gap-4 pb-4">
        <FilteredPathsSettings />
        <LockSettings />
      </div>
    </>
  );
}
