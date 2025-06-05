import { NumberInput } from './utils/InputTypes';
import { SettingsControl } from './utils/SettingsControl';

export function FontSize() {
  return (
    <SettingsControl
      label="Diff Log Font Size"
      labelTooltip="Adjust the diff log font size (10–20px)"
    >
      <NumberInput settingKey="diffLogFontSize" min={10} max={20} />
    </SettingsControl>
  );
}