import { z } from 'zod';

import { ObjectValue, Path, Value } from '@/shared/shared-types';

import { getDiffer as getDifferBase } from '../util/differ';
import { isObj, matchesSChema } from '../util/type-helpers';
import { deleteFromState, duplicateStateProperty, setState as setStateBase } from './shared';
import { createPropertyLocker } from './sharedPropertyLocker';
import { FormatHelpers } from './type';

const HarloweSchema = z.object({
  API_ACCESS: z.object({
    STATE: z.object({
      variables: z.object(),
    }),
  }),
});

export function sanitize(obj: ObjectValue) {
  const result: ObjectValue = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('TwineScript_')) continue;
    if (isObj(value) && Object.keys(value).some((subkey) => subkey.startsWith('TwineScript_')))
      continue;
    result[key] = value;
  }
  return result;
}

function ignoreCheck(key: unknown, value: Value) {
  if (typeof key === 'string' && key.startsWith('TwineScript_')) return true;
  if (
    value &&
    typeof value === 'object' &&
    Object.keys(value).some((key) => key.startsWith('TwineScript_'))
  ) {
    return true;
  }
  return false;
}

const detect = () => matchesSChema(window.Harlowe, HarloweSchema);
const getBaseState = () => window.Harlowe.API_ACCESS.STATE.variables;
const setState = (path: Path, value: unknown) => setStateBase(getBaseState(), path, value);
const { processDiffs, setPathLock } = createPropertyLocker(getBaseState, setState);

export default {
  detect,
  getState: () => sanitize(getBaseState()),
  getDiffer: () => getDifferBase(ignoreCheck),
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getBaseState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getBaseState(), path),
  getPassage: () => window.Harlowe.API_ACCESS.STATE.passage,
  setStatePropertyLock: setPathLock,
  processDiffs,
} satisfies FormatHelpers;
