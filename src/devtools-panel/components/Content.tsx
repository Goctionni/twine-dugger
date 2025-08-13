import { createMemo, createSignal } from 'solid-js';

import { DiffLog } from './DiffLog';
import { HistoryNav } from './HistoryNav';
import { MovableSplit } from './Layout/MovableSplit';
import { StateView } from './StateView/StateView';
import { watchState } from './StateView/watchState/watchState';
import { trackDiffFrames } from './trackDiffFrames';

interface Props {
  kill: () => void;
}

export function Content(props: Props) {
  const kill = () => props.kill();
  const [diffFrames, { clearDiffFrames, getLockedPaths, addLockPath, removeLockPath }] =
    // eslint-disable-next-line solid/reactivity
    trackDiffFrames(kill);
  const [filteredPaths, setFilteredPaths] = createSignal<string[]>([]);

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
    deleteProperty,
  } = watchState(diffFrames);

  const addFilterPath = (path: string) => {
    setFilteredPaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
  };

  const clearFilters = () => setFilteredPaths([]);

  return (
    <MovableSplit
      leftContent={
        <DiffLog
          frames={diffFrames()}
          setPath={setPath}
          onClear={clearDiffFrames}
          filteredPaths={filteredPaths()}
          onAddFilter={addFilterPath}
          onClearFilters={clearFilters}
        />
      }
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
            onDeleteProperty={deleteProperty}
            addLockPath={addLockPath}
            removeLockPath={removeLockPath}
            getLockedPaths={getLockedPaths}
          />
        </>
      }
    />
  );
}
