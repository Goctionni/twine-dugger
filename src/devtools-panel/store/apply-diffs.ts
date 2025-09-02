import { copy } from '@/shared/copy';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import {
  ArrayValue,
  ContainerValue,
  Diff,
  DiffPrimitiveUpdate,
  MapValue,
  ObjectValue,
  SetValue,
} from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

export function applyDiffsToState(oldState: ObjectValue, diffs: Diff[]): ObjectValue {
  const state = copy(oldState) as ContainerValue;
  for (const diff of diffs) {
    if (
      diff.type === 'object' ||
      diff.type === 'map' ||
      diff.type === 'array' ||
      diff.type === 'set'
    ) {
      const obj = getObjectPathValue(state, diff.path);
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
      } else if (diff.type === 'set') {
        const set = obj as SetValue;
        if (diff.subtype === 'add') {
          set.add(diff.newValue);
        } else if (diff.subtype === 'remove') {
          set.delete(diff.oldValue);
        }
      }
    } else {
      const parentPath = diff.path.slice(0, -1);
      const parent = getObjectPathValue(state, parentPath);
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
