import { getDiffer as getDifferBase } from '../util/differ';
import { FormatHelpers } from './type';
import { setState, deleteFromState, sanitize, ignoreCheck } from './shared';

function detect() {
  const api = window.Harlowe?.API_ACCESS?.STATE?.variables;
  return !!api && typeof api === 'object';
}

export default {
  detect,
  getState: () => sanitize(window.Harlowe.API_ACCESS.STATE.variables),
  getDiffer: () => getDifferBase(ignoreCheck),
  setState: (path, value) => setState(window.Harlowe.API_ACCESS.STATE.variables, path, value),
  deleteFromState: (path) => deleteFromState(window.Harlowe.API_ACCESS.STATE.variables, path),
  getPassage: () => window.Harlowe.API_ACCESS.STATE.passage,
} satisfies FormatHelpers;
