import { Accessor, createSignal, createEffect } from 'solid-js';

import { setState, deleteFromState } from '@panel/utils/api';
import { StateViewSelection } from './types';
import { createStateHistory } from './createStateHistory';
import { createGetNavLayers } from './createGetNavLayers';
import { createGetViewValue } from './createGetViewValue';
import { createGetHistoryItems } from './createGetHistoryItems';
import type { DiffFrame, Path } from '@/shared/shared-types';

function pathsEqual(a: Path, b: Path) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function watchState(getFrames: Accessor<DiffFrame[]>) {
  const getStateHistory = createStateHistory(getFrames);
  const [getStateViewSelection, setStateViewSelection] = createSignal<StateViewSelection>({
    historyId: 'latest',
    path: [],
  });

  const getViewValue = createGetViewValue(getStateViewSelection, getStateHistory);

  const getNavLayers = createGetNavLayers(getStateViewSelection, getStateHistory);

  const getHistoryItems = createGetHistoryItems(getStateHistory, getStateViewSelection);

  const [lockedProps, setLockedProps] = createSignal<{ path: Path; value: unknown }[]>([]);

  const lockProperty = (path: Path) => {
    const currentValue = getValueAtPath(path);
    setLockedProps((prev) => {
      if (prev.some((l) => pathsEqual(l.path, path))) return prev;
      return [...prev, { path, value: currentValue }];
    });
  };

  const unlockProperty = (path: Path) => {
    setLockedProps((prev) => prev.filter((l) => !pathsEqual(l.path, path)));
  };

  const isLocked = (path: Path) => {
    return lockedProps().some((l) => pathsEqual(l.path, path));
  };

  function getValueAtPath(path: Path) {
    const history = getStateHistory();
    if (!history.length) return undefined;

    const latest = history[0];
    if (!latest) return undefined;
    return path.reduce((acc: any, key) => (acc ? acc[key] : undefined), latest.state);
  }

  createEffect(() => {
    if (!getFrames().length) return;

    lockedProps().forEach(({ path, value }) => {
      const currentValue = getValueAtPath(path);
      if (currentValue !== value) {
        setState(path, value);
      }
    });
  });

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
    lockProperty,
    unlockProperty,
    isLocked,
  };
}
