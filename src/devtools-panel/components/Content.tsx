import { DiffLog } from './DiffLog';
import { trackDiffFrames } from './trackDiffFrames';
import { MovableSplit } from './Layout/MovableSplit';
import { watchState } from './StateView/watchState/watchState';
import { StateView } from './StateView/StateView';
import { HistoryNav } from './HistoryNav';

export function Content() {
  const diffFrames = trackDiffFrames();
  const {
    getNavLayers,
    getPath,
    getHistoryItems,
    getReadOnly,
    getViewValue,
    setPath,
    setViewValue,
    setViewPropertyValue,
    setHistoryId,
  } = watchState(diffFrames);

  return (
    <MovableSplit
      leftContent={<DiffLog frames={diffFrames()} setPath={setPath} />}
      rightContent={
        <>
          <HistoryNav historyItems={getHistoryItems()} setHistoryId={setHistoryId} />
          <StateView
            path={getPath()}
            navLayers={getNavLayers()}
            viewValue={getViewValue()}
            setPath={setPath}
            readonly={getReadOnly()}
            setViewValue={setViewValue}
            setViewPropertyValue={setViewPropertyValue}
          />
        </>
      }
    />
  );
}
