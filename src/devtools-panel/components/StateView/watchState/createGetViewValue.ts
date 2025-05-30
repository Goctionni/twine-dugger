import { Accessor, createMemo } from 'solid-js';
import { ContainerValue, HistoryItem, StateViewSelection } from './types';

export function createGetViewValue(
  getStateViewSelection: Accessor<StateViewSelection>,
  getStateHistory: Accessor<HistoryItem[]>,
) {
  return createMemo(() => {
    const { historyId, path } = getStateViewSelection();
    const stateHistory = getStateHistory();
    const historyItem = stateHistory.find((item) => item.id === historyId) ?? stateHistory[0];
    if (!historyItem) return null;

    let state = historyItem.state as ContainerValue;
    for (let i = 0; i < path.length; i++) {
      const slug = path[i]!;
      const slugState = Array.isArray(state)
        ? state[Number(slug)]
        : state instanceof Map
          ? state.get(`${slug}`)
          : state[`${slug}`];

      if (!slugState) return slugState;
      if (typeof slugState !== 'object') return slugState;
      if (slugState instanceof Set) return slugState;
      state = slugState;
    }

    return state;
  });
}
