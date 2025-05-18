import { getDiffer as getDifferBase } from '../util/differ';
import { ArrayValue, MapValue, ObjectValue, Value } from '../util/types';
import { FormatHelpers } from './type';

function setState(path: Array<string | number>, value: unknown) {
  type StateObj = ObjectValue | MapValue | ArrayValue;
  let stateObj: StateObj = window.SugarCube.State.variables;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const isLast = i + 1 === path.length;
    if (Array.isArray(stateObj)) {
      // Array
      if (!isLast) {
        stateObj = stateObj[Number(key)] as StateObj;
      } else {
        stateObj[Number(key)] = value as Value;
      }
    } else if (stateObj instanceof Map) {
      // Map
      if (!isLast) {
        stateObj = stateObj.get(`${key}`) as StateObj;
      } else {
        stateObj.set(`${key}`, value as Value);
      }
    } else {
      // Object
      if (!isLast) {
        stateObj = stateObj[`${key}`] as StateObj;
      } else {
        stateObj[`${key}`] = value as Value;
      }
    }

    if (!stateObj || typeof stateObj !== 'object') {
      console.error(`[Twine Dugger]: Tried to set state, but could not resolve path`, {
        path,
        value,
      });
      return;
    }
  }
}

const formatHelpers: FormatHelpers = {
  getDiffer: () => getDifferBase(),
  detect: () => 'SugarCube' in window && typeof window.SugarCube === 'object',
  getState: () => window.SugarCube.State.variables,
  getPassage: () => window.SugarCube.State.passage,
  setState,
};

export default formatHelpers;
