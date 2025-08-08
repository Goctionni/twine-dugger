import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';
import { setState, deleteFromState, duplicateStateProperty } from './shared';
import { z } from 'zod';
import { matchesSChema } from '../util/type-helpers';

const SugarCubeSchema = z.object({
  State: z.object({
    variables: z.object(),
  }),
});

const getBaseState = () => window.SugarCube.State.variables;

export default {
  getDiffer: () => getDifferBase(),
  detect: () => matchesSChema(window.SugarCube, SugarCubeSchema),
  getState: () => getBaseState(),
  getPassage: () => window.SugarCube.State.passage,
  setState: (path, value) => setState(getBaseState(), path, value),
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getBaseState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getBaseState(), path),
} satisfies FormatHelpers;
