import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';
import { setState as setStateBase, deleteFromState, duplicateStateProperty } from './shared';
import { z } from 'zod';
import { matchesSChema } from '../util/type-helpers';
import { ObjectValue, Path, Value } from '@/shared/shared-types';
import { createPropertyLocker } from './sharedPropertyLocker';

const SugarCubeSchema = z.object({
  State: z.object({
    variables: z.object(),
  }),
});

const getBaseState = () => window.SugarCube.State.variables;
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
  if (value instanceof Set) return new Set([...value]);
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
  detect: () => matchesSChema(window.SugarCube, SugarCubeSchema),
  getState,
  getPassage: () => window.SugarCube.State.passage,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getBaseState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getBaseState(), path),
  setStatePropertyLock: setPathLock,
  processDiffs,
} satisfies FormatHelpers;
