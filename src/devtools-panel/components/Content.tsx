import { createSignal } from 'solid-js';
import { DiffLog } from './DiffLog';
import { trackDiffFrames } from './trackDiffFrames';
import { MovableSplit } from './Layout/MovableSplit';
import { watchState } from './StateView/watchState/watchState';
import { StateView } from './StateView/StateView';
import { HistoryNav } from './HistoryNav';

interface Props {
  kill: () => void;
}

export function Content(props: Props) {
  const [diffFrames, { clearDiffFrames, getLockedPaths, addLockPath, removeLockPath }] =
    trackDiffFrames(props.kill);
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
    setFilteredPaths(prev =>
      prev.includes(path) ? prev : [...prev, path]
    );
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
