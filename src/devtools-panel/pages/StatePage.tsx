import { getSettings, setSetting } from '../store/store';
import { MovableSplit } from '../ui/util/movable-split/MovableSplit';
import { DiffLog } from '../views/DiffLog';
import { StateView } from '../views/State/StateView';

export function StatePage() {
  return (
    <MovableSplit
      splitKey="state-page"
      direction={getSettings.state.splitDirection()}
      onDirectionChange={(direction) => setSetting('state.splitDirection', direction)}
      firstLabel="Diff Log"
      secondLabel="State"
      firstContent={<DiffLog />}
      secondContent={<StateView />}
    />
  );
}
