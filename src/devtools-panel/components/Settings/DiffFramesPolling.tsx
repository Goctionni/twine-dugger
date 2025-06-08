import { NumberInput } from './utils/InputTypes';
import { SettingsControl } from './utils/SettingsControl';
import { getDiffLogPolling, setDiffLogPolling } from '../Settings/State/State';

export function DiffPolling() {
  return (
    <SettingsControl
      label="Diff Polling Speed"
      labelTooltip="The speed in which intervals happen to the Diff Log (100-1000 in ms)"
    >
      <NumberInput value={getDiffLogPolling()} setValue={setDiffLogPolling} min={100} max={1000} />
    </SettingsControl>
  );
}