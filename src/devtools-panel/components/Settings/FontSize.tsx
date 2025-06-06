import { NumberInput } from './utils/InputTypes';
import { SettingsControl } from './utils/SettingsControl';
import { getDiffLogFontSize, setDiffLogFontSize } from '../Settings/State/State';

export function FontSize() {
  return (
    <SettingsControl
      label="Diff Log Font Size"
      labelTooltip="Adjust the diff log font size (10–20px)"
    >
      <NumberInput value={getDiffLogFontSize()} setValue={setDiffLogFontSize} min={10} max={20} />
    </SettingsControl>
  );
}