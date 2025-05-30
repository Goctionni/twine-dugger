import { Accessor, createSignal } from 'solid-js';

import { setState } from '@panel/utils/api';
import { StateViewSelection } from './types';
import { createStateHistory } from './createStateHistory';
import { createGetPathChunks } from './createGetPathChunks';
import { createGetViewValue } from './createGetViewValue';
import { createGetHistoryItems } from './createGetHistoryItems';
import type { DiffFrame, Path } from '@/shared/shared-types';

export function watchState(getFrames: Accessor<DiffFrame[]>) {
  const getStateHistory = createStateHistory(getFrames);
  const [getStateViewSelection, setStateViewSelection] = createSignal<StateViewSelection>({
    historyId: 'latest',
    path: [],
  });

  const getViewValue = createGetViewValue(getStateViewSelection, getStateHistory);

  const getPathChunks = createGetPathChunks(getStateViewSelection, getStateHistory);

  const getHistoryItems = createGetHistoryItems(getStateHistory, getStateViewSelection);

  const setPath = (newPath: Path) => {
    setStateViewSelection((prev) => {
      const historyId = prev?.historyId ?? 'latest';
      return { historyId, path: newPath };
    });
  };

  const setHistoryId = (historyId: 'latest' | number) => {
    setStateViewSelection({ historyId, path: [] });
  };

  const getReadOnly = () => getStateViewSelection().historyId !== 'latest';

  return {
    getPathChunks,
    getReadOnly,
    getHistoryItems,
    setHistoryId,
    setPath,
    setState,
    getViewValue,
  };
}
