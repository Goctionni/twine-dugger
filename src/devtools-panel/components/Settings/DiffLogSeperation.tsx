import { BooleanInput } from './utils/InputTypes';
import { SettingsControl } from './utils/SettingsControl';
import { getDiffLogSeparation, setDiffLogSeparation } from '../Settings/State/State';

export function DiffLogSeparation() {
  return (
    <SettingsControl
      label="Easier Diff Log Separation"
      labelTooltip="Show more explicit separation between Diff Log states"
    >
      <BooleanInput value={getDiffLogSeparation()} setValue={setDiffLogSeparation} />
    </SettingsControl>
  );
}