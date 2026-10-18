import { getSettings, setSetting } from '@/devtools-panel/store/store';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';

import {
  onFontSizeChange,
  onMaxHistorySlicesChange,
  onPollingIntervalChange,
} from './diffLogSetters';
import { SettingControl } from './SettingControl';

export function DiffLogSettings() {
  const { fontSize, pollingInterval, maxHistorySlices, headingStyle } = getSettings.diffLog;

  return (
    <>
      <SettingControl label="Font size">
        {(id) => <NumberInput inputProps={{ id }} value={fontSize()} onChange={onFontSizeChange} />}
      </SettingControl>
      <SettingControl label="Polling interval">
        {(id) => (
          <NumberInput
            inputProps={{ id }}
            value={pollingInterval()}
            onChange={onPollingIntervalChange}
          />
        )}
      </SettingControl>
      <SettingControl label="Max history slices">
        {(id) => (
          <NumberInput
            inputProps={{ id }}
            value={maxHistorySlices()}
            onChange={onMaxHistorySlicesChange}
          />
        )}
      </SettingControl>
      <SettingControl label="Heading Emphasis" noLabel>
        {(id) => (
          <BooleanInput
            value={headingStyle() === 'distinct'}
            onChange={(value) => setSetting('diffLog.headingStyle', value ? 'distinct' : 'default')}
            id={id}
            label="Heading Emphasis"
          />
        )}
      </SettingControl>
    </>
  );
}
