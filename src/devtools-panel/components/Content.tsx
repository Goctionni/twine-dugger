import { DiffLog } from './DiffLog';
import { trackDiffFrames } from './trackDiffFrames';
import { MovableSplit } from './Layout/MovableSplit';
import { watchState } from './StateView/watchState/watchState';
import { StateView } from './StateView/StateView';
import { createEffect } from 'solid-js';

export function Content() {
  const diffFrames = trackDiffFrames();
  const { getPathChunks, getSelectedValue, selectPath, setSelectedValue } = watchState(diffFrames);

  return (
    <MovableSplit
      leftContent={<DiffLog frames={diffFrames()} />}
      rightContent={
        <StateView
          getPathChunks={getPathChunks}
          getSelectedValue={getSelectedValue}
          selectPath={selectPath}
          setSelectedValue={setSelectedValue}
        />
      }
    />
  );
}
