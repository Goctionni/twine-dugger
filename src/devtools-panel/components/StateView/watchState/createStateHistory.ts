import { Accessor, createMemo, createResource } from 'solid-js';

import { getState } from '@/devtools-panel/utils/api';
import { copy } from '@/shared/copy';
import {
  ArrayValue,
  ContainerValue,
  Diff,
  DiffFrame,
  DiffPrimitiveUpdate,
  MapValue,
  ObjectValue,
  Path,
  SetValue,
  Value,
} from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { HistoryItem } from './types';
import { getContainerItem } from './watchHelpers';

function getByPath(container: ContainerValue | SetValue, path: Path) {
  let current: Value = container;
  for (const pathSlug of path) {
    if (!current) return;
    if (typeof current !== 'object') return;
    current = getContainerItem(current, pathSlug);
  }
  return current;
}

function applyDiffsToState(oldState: ObjectValue, diffs: Diff[]): ObjectValue {
  const state = copy(oldState) as ContainerValue | SetValue;
  for (const diff of diffs) {
    if (
      diff.type === 'object' ||
      diff.type === 'map' ||
      diff.type === 'array' ||
      diff.type === 'set'
    ) {
      const obj = getByPath(state, diff.path);
      if (!obj) {
        console.error('Unable to resolve path in state', { path: diff.path, state });
        continue;
      }
      const objType = getSpecificType(obj);
      if (diff.type !== objType) {
        console.error(`Resolved path for diff type ${diff.type}, is not a ${diff.type}`, {
          diff,
          state,
          resolvedValue: obj,
        });
        continue;
      }

      if (diff.type === 'object') {
        if (diff.subtype === 'add') {
          (obj as ObjectValue)[diff.key] = diff.newValue;
        } else if (diff.subtype === 'remove') {
          delete (obj as ObjectValue)[diff.key];
        }
      } else if (diff.type === 'map') {
        if (diff.subtype === 'add') {
          (obj as MapValue).set(diff.key, diff.newValue);
        } else if (diff.subtype === 'remove') {
          (obj as MapValue).delete(diff.key);
        }
      } else if (diff.type === 'set') {
        if (diff.subtype === 'add') {
          (obj as SetValue).add(diff.newValue);
        } else if (diff.subtype === 'remove') {
          (obj as SetValue).delete(diff.oldValue);
        }
      } else if (diff.type === 'array') {
        const arr = obj as ArrayValue;
        if (diff.subtype !== 'instructions') continue;
        for (const instruction of diff.instructions) {
          if (instruction.type === 'add') {
            arr.splice(instruction.index, 0, instruction.value);
          } else if (instruction.type === 'remove') {
            arr.splice(instruction.index, 1);
          } else if (instruction.type === 'move') {
            const moved = arr.splice(instruction.from, 1);
            arr.splice(instruction.to, 0, ...moved);
          }
        }
      }
    } else {
      const parentPath = diff.path.slice(0, -1);
      const parent = getByPath(state, parentPath);
      if (!parent) {
        console.error('Unable to resolve parent of path in state', { parentPath, state });
        continue;
      }
      const parentType = getSpecificType(parent);
      if (parentType !== 'array' && parentType !== 'object' && parentType !== 'map') {
        console.error('Parent path did not resolve to a container type', {
          parentPath,
          state,
          resolvedValue: parent,
        });
        continue;
      }

      if (parentType === 'array') {
        const index = Number(diff.path.at(-1));
        (parent as ArrayValue)[index] = (diff as DiffPrimitiveUpdate).newValue;
      } else if (parentType === 'map') {
        const key = `${diff.path.at(-1)}`;
        (parent as MapValue).set(key, (diff as DiffPrimitiveUpdate).newValue);
      } else if (parentType === 'object') {
        const property = `${diff.path.at(-1)}`;
        (parent as ObjectValue)[property] = (diff as DiffPrimitiveUpdate).newValue;
      }
    }
  }
  return state as ObjectValue;
}

let historyId = 0;
export function createStateHistory(getFrames: Accessor<DiffFrame[]>) {
  const [getInitialState] = createResource(async () => {
    const result = await getState();
    if (!result) throw new Error('getState returned empty value');
    return result.state;
  });

  const getLines = createMemo<HistoryItem[]>((prev): HistoryItem[] => {
    const [lastItem] = prev;
    if (!lastItem) {
      const initialState = getInitialState();
      if (!initialState) return [];

      return [{ id: historyId++, diffingFrame: getFrames()[0], state: initialState }];
    }

    const frames = getFrames();
    const firstProcessedIndex = frames.findIndex((frame) => lastItem.diffingFrame === frame);
    const unprocessedFrames = frames
      .slice(0, firstProcessedIndex >= 0 ? firstProcessedIndex : undefined)
      .filter((frame) => frame.changes.length);
    if (unprocessedFrames.length === 0) return prev;

    const newFrameItems: HistoryItem[] = new Array(unprocessedFrames.length);
    let lastState = lastItem.state;
    // Process frames in reverse order (old to new)
    for (let i = unprocessedFrames.length - 1; i >= 0; i--) {
      const diffingFrame = unprocessedFrames[i]!;
      const frameState = applyDiffsToState(lastState, diffingFrame.changes);
      newFrameItems[i] = {
        id: historyId++,
        diffingFrame,
        state: frameState,
      };
      lastState = frameState;
    }
    return [...newFrameItems, ...prev].slice(0, 25);
  }, []);

  return getLines;
}
