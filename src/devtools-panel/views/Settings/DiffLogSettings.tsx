import { getSettings } from '@/devtools-panel/store/store';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';

import {
  onFontSizeChange,
  onMaxHistorySlicesChange,
  onPollingIntervalChange,
} from './util/diffLogSetters';
import { SettingRow } from './util/SettingRow';

export function DiffLogSettings() {
  const { fontSize, pollingInterval, maxHistorySlices } = getSettings.diffLog;

  return (
    <>
      <SettingRow
        label="Text size"
        description="The size of the text in the diff log."
        setting="diffLog.fontSize"
        unit="pixels"
      >
        <NumberInput
          inputProps={{ 'aria-label': 'Text size' }}
          value={fontSize()}
          onChange={onFontSizeChange}
        />
      </SettingRow>
      <SettingRow
        label="Polling interval"
        description="How often the panel asks the game for changes."
        setting="diffLog.pollingInterval"
        unit="milliseconds"
      >
        <NumberInput
          inputProps={{ 'aria-label': 'Polling interval' }}
          value={pollingInterval()}
          onChange={onPollingIntervalChange}
        />
      </SettingRow>
      <SettingRow
        label="Changes kept"
        description="How many changes the diff log and the History tab of a value keep."
        setting="diffLog.maxHistorySlices"
        unit="changes"
      >
        <NumberInput
          inputProps={{ 'aria-label': 'Changes kept' }}
          value={maxHistorySlices()}
          onChange={onMaxHistorySlicesChange}
        />
      </SettingRow>
    </>
  );
}
