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

const warnedFunctionKeys = new Set<string>();

function getState(): Record<string, unknown> {
  const stateVars = window.SugarCube.State.variables as Record<string, unknown>;

  const isPlainObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === 'object' && val !== null && !Array.isArray(val);

  const rootCopy: Record<string, unknown> | unknown[] = Array.isArray(stateVars) ? [] : {};
  const stack: Array<{ source: any; target: any; path: string }> = [
    { source: stateVars, target: rootCopy, path: '' },
  ];

  let globalWarned = false;

  while (stack.length > 0) {
    const { source, target, path } = stack.pop()!;

    for (const key in source) {
      const value = source[key];
      const fullPath = path ? `${path}.${key}` : key;

      if (typeof value === 'function') {
        if (!warnedFunctionKeys.has(fullPath)) {
          warnedFunctionKeys.add(fullPath);
          if (!globalWarned) {
            console.error(
              [
                '[Twine Dugger]: One or more functions found in State.variables.',
                'These will be stripped to avoid clone errors.',
                'Consider adding the functions to the `Setup` object.',
              ].join(' ')
            );
            globalWarned = true;
          }
          console.warn(`State.variables["${fullPath}"] contains a function, which cannot be cloned.`);
        }
        continue;
      }

      if (Array.isArray(value)) {
        target[key] = [];
        stack.push({ source: value, target: target[key], path: fullPath });
      } else if (isPlainObject(value)) {
        target[key] = {};
        stack.push({ source: value, target: target[key], path: fullPath });
      } else {
        target[key] = value;
      }
    }
  }

  if (!stateVars || typeof stateVars !== 'object') {
    console.error('[Twine Dugger]: State.variables not available.');
    return {};
  }

  return rootCopy as Record<string, unknown>;
}


const formatHelpers: FormatHelpers = {
  getDiffer: () => getDifferBase(),
  detect: () => 'SugarCube' in window && typeof window.SugarCube === 'object',
  getState,
  getPassage: () => window.SugarCube.State.passage,
  setState,
};

export default formatHelpers;
