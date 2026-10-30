import { SettingRow } from './util/SettingRow';
import { describeSplitDirection, SplitDirectionSelect } from './util/SplitDirectionSelect';

export function PassagesSettings() {
  return (
    <SettingRow
      label="Split direction"
      description="Whether the passage editor is beside the list or below it."
      setting="passages.splitDirection"
      formatDefault={describeSplitDirection}
    >
      <SplitDirectionSelect setting="passages.splitDirection" label="Split direction" />
    </SettingRow>
  );
}
