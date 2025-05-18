import { Accessor, createEffect, createSignal } from 'solid-js';
import { Frame } from '../DiffLog/types';
import { getState, setState } from '@panel/utils/api';
import {
  ArrayValue,
  DiffPrimitiveUpdate,
  MapValue,
  ObjectValue,
  Path,
  SetValue,
  Value,
} from '@content/util/types';
import { getType } from '@content/util/differ';
import { ChildKey, PathChunk, SelectedValue } from './types';

type ContainerValue = ObjectValue | ArrayValue | MapValue;

function compareChildKeys(key1: ChildKey, key2: ChildKey) {
  const k1IsObj = ['object', 'map'].includes(key1.type);
  const k2IsObj = ['object', 'map'].includes(key2.type);
  if (k1IsObj !== k2IsObj) return k1IsObj ? -1 : 1;
  const k1IsArr = key1.type === 'array';
  const k2IsArr = key2.type === 'array';
  if (k1IsArr !== k2IsArr) return k1IsArr ? -1 : 1;
  const k1IsSet = key1.type === 'set';
  const k2IsSet = key2.type === 'set';
  if (k1IsSet !== k2IsSet) return k1IsSet ? -1 : 1;
  if (typeof key1.text !== typeof key2.text) return 0;
  if (typeof key1.text === 'number') return key1.text - Number(key2.text);
  return `${key1.text}`.localeCompare(`${key2.text}`);
}

function createPathChunk(name: string, value: ObjectValue | MapValue | ArrayValue): PathChunk {
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

function getPathChunkValue(chunk: PathChunk) {
  if (!chunk.selectedChildKey) return chunk.getValue();
  if (chunk.type === 'array') {
    return chunk.getValue()[chunk.selectedChildKey];
  }
  if (chunk.type === 'object') {
    return chunk.getValue()[chunk.selectedChildKey];
  }
  if (chunk.type === 'map') {
    return chunk.getValue().get(chunk.selectedChildKey);
  }
}

export function getSpecificType(value: Value) {
  if (typeof value === 'function') return 'function';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Set) return 'set';
  if (value instanceof Map) return 'map';
  if (typeof value === 'object' && value !== null) return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value === null) return 'null';
  return 'undefined';
}

export function watchState(frames: Accessor<Frame[]>) {
  const [getPathChunks, setPathChunks] = createSignal<PathChunk[]>([]);
  const getSelectedValue = (): SelectedValue => {
    const lastChunk = getPathChunks().at(-1);
    if (!lastChunk) return { name: '', type: 'undefined' };
    const chunkValue = getPathChunkValue(lastChunk);
    const type = getSpecificType(chunkValue);
    if (type === 'null' || type === 'undefined')
      return { name: lastChunk.selectedChildKey ?? lastChunk.name, type };
    return {
      name: lastChunk.selectedChildKey ?? lastChunk.name,
      type,
      value: chunkValue,
    } as SelectedValue;
  };

  let state: ObjectValue | null;
  getState().then((result) => {
    if (!result) return;
    state = result.state;
    setPathChunks([createPathChunk('State', result.state)]);
  });

  // This will update `state` using `diffs`
  createEffect(() => {
    const [frame] = frames();
    const diffs = frame?.changes;
    if (!diffs?.length) return;
    if (!state) return;

    const removedValues: Value[] = [];
    const updatedContainers: ContainerValue[] = [];

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
        const objType = getType(obj);
        if (diff.type !== objType) {
          console.error(`Resolved path for diff type ${diff.type}, is not a ${diff.type}`, {
            diff,
            state,
            resolvedValue: obj,
          });
          continue;
        }
        updatedContainers.push(obj as ContainerValue);
        if (diff.type === 'object') {
          if (diff.subtype === 'add') {
            (obj as ObjectValue)[diff.key] = diff.newValue;
          } else if (diff.subtype === 'remove') {
            removedValues.push((obj as ObjectValue)[diff.key]);
            delete (obj as ObjectValue)[diff.key];
          }
        } else if (diff.type === 'map') {
          if (diff.subtype === 'add') {
            (obj as MapValue).set(diff.key, diff.newValue);
          } else if (diff.subtype === 'remove') {
            removedValues.push((obj as MapValue).get(diff.key));
            (obj as MapValue).delete(diff.key);
          }
        } else if (diff.type === 'set') {
          if (diff.subtype === 'add') {
            (obj as SetValue).add(diff.newValue);
          } else if (diff.subtype === 'remove') {
            removedValues.push(diff.oldValue);
            (obj as SetValue).delete(diff.oldValue);
          }
        } else if (diff.type === 'array') {
          const arr = obj as ArrayValue;
          if (diff.subtype !== 'instructions') continue;
          for (const instruction of diff.instructions) {
            if (instruction.type === 'add') {
              arr.splice(instruction.index, 0, instruction.value);
            } else if (instruction.type === 'remove') {
              const removed = arr.splice(instruction.index, 1);
              removedValues.push(...removed);
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
        const parentType = getType(parent);
        if (parentType !== 'array' && parentType !== 'object' && parentType !== 'map') {
          console.error('Parent path did not resolve to a container type', {
            parentPath,
            state,
            resolvedValue: parent,
          });
          continue;
        }
        updatedContainers.push(parent as ContainerValue);
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

    setPathChunks((prev) => {
      const notFoundIndex = prev.findIndex((item) => removedValues.includes(item.getValue()));
      if (notFoundIndex === -1) {
        if (!prev.some((item) => updatedContainers.includes(item.getValue()))) return prev;
        return prev.map((item): PathChunk => {
          if (!updatedContainers.includes(item.getValue())) return item;
          return {
            ...createPathChunk(item.name, item.getValue()),
            selectedChildKey: item.selectedChildKey,
          } as typeof item;
        });
      }
      return prev.slice(0, notFoundIndex).map((item): PathChunk => {
        if (!updatedContainers.includes(item.getValue())) return item;
        return {
          ...createPathChunk(item.name, item.getValue()),
          selectedChildKey: item.selectedChildKey,
        } as typeof item;
      });
    });
  });

  function setSelectedValue(newValue: Value, keyOrIndex?: string | number) {
    const path = getPathChunks()
      .map((chunk) => chunk.selectedChildKey!)
      .filter((value) => {
        if (value === null) return false;
        if (typeof value === 'undefined') return false;
        return true;
      });
    if (typeof keyOrIndex !== 'undefined') path.push(keyOrIndex);
    setState(path, newValue);
  }

  function selectPath(parentChunk: PathChunk, selectedChildKey: string | number) {
    setPathChunks((currentPath) => {
      const index = currentPath.indexOf(parentChunk);
      if (index === -1) return currentPath;
      if (parentChunk.selectedChildKey === selectedChildKey) {
        return [
          ...currentPath.slice(0, index),
          {
            ...currentPath[index],
            selectedChildKey: undefined,
          },
        ];
      }

      const before = currentPath.slice(0, index);
      const self = { ...parentChunk, selectedChildKey } as PathChunk;
      const selectedValue = getPathChunkValue(self);
      if (!selectedValue || typeof selectedValue !== 'object' || selectedValue instanceof Set) {
        // Selected value has no subpath, don't add an additional path chunk
        return [...before, self];
      }
      if (Array.isArray(selectedValue)) {
        if (selectedValue.every(isPrimitive)) {
          // It's an array with only primitive values, don't add it as a path chunk
          return [...before, self];
        }
      } else if (selectedValue instanceof Map) {
        // It's a map with only primitive values, don't add it as a path chunk
        if (selectedValue.values().every(isPrimitive)) return [...before, self];
      } else {
        // It's an object with only primitive values, don't add it as a path chunk
        if (Object.values(selectedValue).every(isPrimitive)) return [...before, self];
      }
      // Selected value has subpath, add an additional path chunk
      return [...before, self, createPathChunk(`${selectedChildKey}`, selectedValue)];
    });
  }

  return {
    getPathChunks,
    getSelectedValue,
    setSelectedValue,
    selectPath,
  };
}

const COMMON_ID_KEYS = ['id', '_id', '__id', 'key', 'uuid', '_uuid', '__uuid'];
function getPotentialId(obj: unknown) {
  if (Array.isArray(obj)) return undefined;
  if (obj instanceof Set) return undefined;
  if (!obj || typeof obj !== 'object') return undefined;

  const objKeys = obj instanceof Map ? [...obj.keys()] : Object.keys(obj);
  for (const key of COMMON_ID_KEYS) {
    if (objKeys.includes(key)) {
      const value = obj instanceof Map ? obj.get(key) : obj[key as keyof typeof obj];
      if (value === null || value === undefined || value === '') continue;
      if (typeof value === 'object') continue;
      if (typeof value === 'function') continue;
      return value;
    }
  }
  return undefined;
}

function getContainerItem(container: ContainerValue | SetValue, key: string | number) {
  if (Array.isArray(container)) {
    const index = typeof key === 'number' ? key : Number(key);
    return container[index];
  }
  if (container instanceof Set) {
    if (container.has(key)) return key;
    return container.values().find((value) => getPotentialId(value) === key);
  }
  if (container instanceof Map) {
    return container.get(key.toString());
  }
  return container[key] || container[key.toString()];
}

function getByPath(container: ContainerValue | SetValue, path: Path) {
  let current: Value = container;
  for (const pathSlug of path) {
    if (!current) return;
    if (typeof current !== 'object') return;
    current = getContainerItem(current, pathSlug);
  }
  return current;
}

function isPrimitive(value: unknown) {
  return !value || typeof value !== 'object';
}
