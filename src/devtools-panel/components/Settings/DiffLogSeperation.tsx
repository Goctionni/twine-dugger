import { BooleanInput } from './utils/InputTypes';
import { SettingsControl } from './utils/SettingsControl';

export function DiffLogSeparation() {
  return (
    <SettingsControl
      label="Easier Diff Log Separation"
      labelTooltip="Show more explicit separation between Diff Log states"
    >
      <BooleanInput settingKey="diffLogSeparation" />
    </SettingsControl>
  );
}