import { Accessor, createSignal } from 'solid-js';

import { setState } from '@panel/utils/api';
import { StateViewSelection } from './types';
import { createStateHistory } from './createStateHistory';
import { createGetNavLayers } from './createGetNavLayers';
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

  const setHistoryId = (historyId: 'latest' | number) => {
    setStateViewSelection({ historyId, path: [] });
  };

  const getReadOnly = () => getStateViewSelection().historyId !== 'latest';

  return {
    getHistoryItems,
    getNavLayers,
    getViewValue,
    getReadOnly,
    setHistoryId,
    setPath,
    setViewValue,
    setViewPropertyValue,
  };
}
