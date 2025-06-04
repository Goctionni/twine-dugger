import { Accessor, createMemo } from 'solid-js';
import { HistoryItem, HistoryNode, StateViewSelection } from './types';

export function createGetHistoryItems(
  getStateHistory: Accessor<HistoryItem[]>,
  getStateViewSelection: Accessor<StateViewSelection>,
) {
  return createMemo(() => {
    // get ids
    const ids = getStateHistory()
      .map(({ id }, index) => (index ? id : 'latest'))
      .toReversed();

    // combine with state-view-selection for active flag
    const viewSelection = getStateViewSelection();
    const historyId = ids.includes(viewSelection.historyId) ? viewSelection.historyId : 'latest';
    return ids.map(
      (id): HistoryNode => ({
        id,
        active: id === historyId,
      }),
    );
  });
}
