import { jsonReplacer, jsonReviver } from '@/shared/json-helper';
import { getDiffer } from './util/differ';
import { ArrayValue, MapValue, ObjectValue, Value } from './util/types';

function getState() {
  return window.SugarCube.State.variables;
}

function init() {
  const differ = getDiffer();
  let lastState = structuredClone(getState());
  window.TwineDugger = {
    utils: {
      jsonReplacer,
      jsonReviver,
    },
    getState: () => ({
      passage: window.SugarCube.State.passage,
      state: getState(),
    }),
    getDiffs: () => {
      const newState = getState();
      const diffs = differ(lastState, newState);
      lastState = structuredClone(newState);
      return {
        passage: window.SugarCube.State.passage,
        diffs,
      };
    },
    setState: (path, value) => {
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
    },
  };
}

init();
