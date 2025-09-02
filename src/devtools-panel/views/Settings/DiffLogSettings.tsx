import { createGetSetting, setSetting } from '@/devtools-panel/store';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';

import { onFontSizeChange, onPollingIntervalChange } from './diffLogSetters';
import { SettingControl } from './SettingControl';

export function DiffLogSettings() {
  const getDiffLogFontSize = createGetSetting('diffLog.fontSize');
  const getDiffLogPollingInterval = createGetSetting('diffLog.pollingInterval');
  const getDiffLogHeadingStyle = createGetSetting('diffLog.headingStyle');

  return (
    <>
      <SettingControl label="Font size">
        {(id) => (
          <NumberInput
            inputProps={{ id }}
            value={getDiffLogFontSize()}
            onChange={onFontSizeChange}
          />
        )}
      </SettingControl>
      <SettingControl label="Polling interval">
        {(id) => (
          <NumberInput
            inputProps={{ id }}
            value={getDiffLogPollingInterval()}
            onChange={onPollingIntervalChange}
          />
        )}
      </SettingControl>
      <SettingControl label="Heading Emphasis" noLabel>
        {(id) => (
          <BooleanInput
            value={getDiffLogHeadingStyle() === 'distinct'}
            onChange={(value) => setSetting('diffLog.headingStyle', value ? 'distinct' : 'default')}
            id={id}
          />
        )}
      </SettingControl>
    </>
  );
}
