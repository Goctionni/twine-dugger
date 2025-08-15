import { deleteFromState, setState } from '@panel/utils/api';
import { Accessor, createSignal } from 'solid-js';

import type { DiffFrame, Path } from '@/shared/shared-types';

import { createGetHistoryItems } from './createGetHistoryItems';
import { createGetNavLayers } from './createGetNavLayers';
import { createGetViewValue } from './createGetViewValue';
import { createStateHistory } from './createStateHistory';
import { StateViewSelection } from './types';

export function watchState(getFrames: Accessor<DiffFrame[]>) {
  const getStateHistory = createStateHistory(getFrames);
  const [getStateViewSelection, setStateViewSelection] = createSignal<StateViewSelection>({
    historyId: 'latest',
    path: [],
  });

  const getState = () => getStateHistory()[0]?.state;

  const getViewValue = createGetViewValue(getStateViewSelection, getStateHistory);

  const getNavLayers = createGetNavLayers(getStateViewSelection, getStateHistory);

  const getHistoryItems = createGetHistoryItems(getStateHistory, getStateViewSelection);

  const setPath = (newPath: Path) => {
    setStateViewSelection((prev) => {
      const historyId = prev?.historyId ?? 'latest';
      return { historyId, path: newPath };
    });
  };

  const setViewValue = (value: unknown) => setState(getStateViewSelection().path, value);

  const setViewPropertyValue = (property: string | number, value: unknown) =>
    setState([...getStateViewSelection().path, property], value);

  const deleteProperty = (path: Path) => deleteFromState(path);

  const setHistoryId = (historyId: 'latest' | number) => {
    setStateViewSelection({ historyId, path: [] });
  };

  const getReadOnly = () => getStateViewSelection().historyId !== 'latest';

  const getPath = () => getStateViewSelection().path;

  return {
    getHistoryItems,
    getPath,
    getNavLayers,
    getViewValue,
    getReadOnly,
    setHistoryId,
    setPath,
    setViewValue,
    setViewPropertyValue,
    deleteProperty,
    getState,
  };
}
