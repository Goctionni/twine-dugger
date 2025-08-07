import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';
import { setState, deleteFromState } from './shared';
import { z } from 'zod';
import { matchesSChema } from '../util/type-helpers';

const SugarCubeSchema = z.object({
  State: z.object({
    variables: z.object(),
  }),
});

export default {
  getDiffer: () => getDifferBase(),
  detect: () => matchesSChema(window.SugarCube, SugarCubeSchema),
  getState: () => window.SugarCube.State.variables,
  getPassage: () => window.SugarCube.State.passage,
  setState: (path, value) => setState(window.SugarCube.State.variables, path, value),
  deleteFromState: (path) => deleteFromState(window.SugarCube.State.variables, path),
} satisfies FormatHelpers;
