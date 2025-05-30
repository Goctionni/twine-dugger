import { Accessor, createMemo } from 'solid-js';
import { ChildKey, NavLayers, PathChunk } from '../types';
import { ContainerValue, HistoryItem, StateViewSelection } from './types';
import { compareChildKeys } from './watchHelpers';
import { getSpecificType } from '@/shared/type-helpers';

export function createGetPathChunks(
  getStateViewSelection: Accessor<StateViewSelection>,
  getStateHistory: Accessor<HistoryItem[]>,
) {
  return createMemo<NavLayers>((prev) => {
    const { historyId, path } = getStateViewSelection();
    const history = getStateHistory();
    const state = history.find((item) => item.id === historyId) ?? history[0];
    if (!state) return { historyId, pathChunks: [] };

    if (!prev) {
      // If there is no previous value, this is the initial value. If this is the initial value,
      // we can more or less ignore the rest of the state selection.
      return { historyId, pathChunks: [createPathChunk('State', state.state)] };
    }

    if (prev.historyId !== historyId) {
      // If the previous value is from a different history id, we can also ignore the rest of
      // the state selection
      return { historyId, pathChunks: [createPathChunk('State', state.state)] };
    }

    let layerState = state.state as ContainerValue;
    const result: NavLayers = {
      historyId,
      pathChunks: [createPathChunk('State', state.state)],
    };

    for (const slug of path) {
      const sublayerState = Array.isArray(layerState)
        ? layerState[Number(slug)]
        : layerState instanceof Map
          ? layerState.get(`${slug}`)
          : layerState[`${slug}`];

      if (!sublayerState) break;
      if (typeof sublayerState !== 'object') break;
      if (sublayerState instanceof Set) break;
      result.pathChunks.push(createPathChunk(`${slug}`, sublayerState));
      layerState = sublayerState;
    }

    return result;
  });
}

function createPathChunk(name: string, value: ContainerValue): PathChunk {
  if (Array.isArray(value)) {
    return {
      name,
      type: 'array',
      getValue: () => value,
      childKeys: [...value.keys()]
        .map(
          (index): ChildKey<number> => ({
            text: index,
            type: getSpecificType(value[index]),
          }),
        )
        .sort(compareChildKeys),
    };
  }
  if (value instanceof Map) {
    return {
      name,
      type: 'map',
      getValue: () => value,
      childKeys: [...value.keys()]
        .map(
          (key): ChildKey<string> => ({
            text: key,
            type: getSpecificType(value.get(key)),
          }),
        )
        .sort(compareChildKeys),
    };
  }
  return {
    name,
    type: 'object',
    getValue: () => value,
    childKeys: Object.keys(value)
      .map(
        (key): ChildKey<string> => ({
          text: key,
          type: getSpecificType(value[key]),
        }),
      )
      .sort(compareChildKeys),
  };
}
