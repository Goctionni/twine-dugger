import { type } from 'arktype';

import type {
  FormatPassage,
  ObjectValue,
  Path,
  SugarCubeGlobals,
  Value,
} from '@/shared/shared-types';

import { getDiffer as getDifferBase } from '../util/differ';
import { deleteFromState, duplicateStateProperty, setState as setStateBase } from './shared';
import { createPropertyLocker } from './sharedPropertyLocker';
import type { FormatHelpers } from './type';

const sugarCubeSchema = type({
  SugarCube: {
    State: {
      variables: 'object',
      passage: 'string',
    },
    Engine: {
      play: 'Function',
    },
    Story: {
      ifId: 'string',
    },
  } as type.cast<SugarCubeGlobals['SugarCube']>,
});

const sugarcube = () => sugarCubeSchema.assert(window).SugarCube;

const getBaseState = () => sugarcube().State.variables;
const setState = (path: Path, value: unknown) => setStateBase(getBaseState(), path, value);

const { processDiffs, setPathLock } = createPropertyLocker(getBaseState, setState);

function copy(value: Value): Value {
  if (!value) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(copy);
  if (value instanceof Map) {
    const entries = [...value.entries()] as Array<[string, Value]>;
    return new Map(entries.map(([key, itemValue]) => [key, copy(itemValue)]));
  }
  if (value instanceof Set) return new Set(value);
  const object: Record<string, Value> = {};
  for (const [key, itemValue] of Object.entries(value)) {
    object[key] = copy(itemValue);
  }
  return object;
}

function getState(sanitized?: boolean) {
  const state = getBaseState();
  if (!sanitized) return state;
  return copy(state) as ObjectValue;
}

export default {
  getDiffer: () => getDifferBase(),
  detect: () => sugarCubeSchema.allows(window),
  getState,
  getPassage: () => sugarcube().State.passage,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getBaseState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getBaseState(), path),
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
  goToPassage: (passageName) => sugarcube().Engine.play(passageName),
  setPassage: (passage) => createOrUpdatePassage(passage),
} satisfies FormatHelpers;

function createOrUpdatePassage({ name, source, tags }: FormatPassage) {
  const storyAPI = sugarcube().Story;
  if (storyAPI.has(name)) {
    const passage = storyAPI.get(name);
    passage.element!.textContent = source;
    if (tags) {
      passage.tags = tags;
      passage.element!.setAttribute('tags', tags.join(' '));
    }
  } else {
    storyAPI.add({
      name: name,
      text: source,
      tags: tags ?? [],
    });
  }
}
