import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';
import { setState as setStateBase, deleteFromState, duplicateStateProperty } from './shared';
import { z } from 'zod';
import { matchesSChema } from '../util/type-helpers';
import { Path } from '@/shared/shared-types';
import { createPropertyLocker } from './sharedPropertyLocker';

const SugarCubeSchema = z.object({
  State: z.object({
    variables: z.object(),
  }),
});

const getBaseState = () => window.SugarCube.State.variables;
const setState = (path: Path, value: unknown) => setStateBase(getBaseState(), path, value);

const { processDiffs, setPathLock } = createPropertyLocker(getBaseState, setState);

export default {
  getDiffer: () => getDifferBase(),
  detect: () => matchesSChema(window.SugarCube, SugarCubeSchema),
  getState: () => getBaseState(),
  getPassage: () => window.SugarCube.State.passage,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getBaseState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getBaseState(), path),
  setStatePropertyLock: setPathLock,
  processDiffs,
} satisfies FormatHelpers;
