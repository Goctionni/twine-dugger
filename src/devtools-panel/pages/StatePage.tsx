import { MovableSplit } from '../ui/util/MovableSplit';
import { DiffLog } from '../views/DiffLog';
import { HistoryNav } from '../views/State/HistoryNav';
import { StateView } from '../views/State/StateView';

export function StatePage() {
  return (
    <MovableSplit
      leftContent={<DiffLog />}
      rightContent={
        <>
          <HistoryNav />
          <StateView />
        </>
      }
    />
  );
}
