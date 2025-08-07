import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';
import { setState, deleteFromState } from './shared';
import { z } from 'zod';
import { isObj, matchesSChema } from '../util/type-helpers';
import { ObjectValue, Value } from '@/shared/shared-types';

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

export default {
  detect,
  getState: () => sanitize(getBaseState()),
  getDiffer: () => getDifferBase(ignoreCheck),
  setState: (path, value) => setState(getBaseState(), path, value),
  deleteFromState: (path) => deleteFromState(getBaseState(), path),
  getPassage: () => window.Harlowe.API_ACCESS.STATE.passage,
} satisfies FormatHelpers;
