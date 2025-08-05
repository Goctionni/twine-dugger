import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';
import { setState, deleteFromState } from './shared';

export default {
  getDiffer: () => getDifferBase(),
  detect: () => 'SugarCube' in window && typeof window.SugarCube === 'object',
  getState: () => window.SugarCube.State.variables,
  getPassage: () => window.SugarCube.State.passage,
  setState: (path, value) => setState(window.SugarCube.State.variables, path, value),
  deleteFromState: (path) => deleteFromState(window.SugarCube.State.variables, path),
} satisfies FormatHelpers;
