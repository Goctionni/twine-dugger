import { ArrayValue, MapValue, ObjectValue, Path, Value } from '@/shared/shared-types';
import { isObj } from '../util/type-helpers';

type StateObj = ObjectValue | MapValue | ArrayValue;

export function getStateValue(
  stateRoot: ObjectValue | MapValue | ArrayValue,
  path: Array<string | number>,
) {
  let stateObj: Value = stateRoot;
  for (let i = 0; i < path.length; i++) {
    if (!isObj(stateObj)) {
      console.error(`[Twine Dugger]: Could not resolve path`, { path });
      return null;
    }

    const key = path[i];
    if (Array.isArray(stateObj)) {
      stateObj = stateObj[Number(key)] as StateObj;
    } else if (stateObj instanceof Map) {
      stateObj = stateObj.get(`${key}`) as StateObj;
    } else {
      stateObj = stateObj[`${key}`] as StateObj;
    }
  }

  return stateObj;
}

export function duplicateStateProperty(
  stateRoot: ObjectValue | MapValue | ArrayValue,
  parentPath: Path,
  sourceKey: string | number,
  targetKey?: string,
) {
  const parentObj = getStateValue(stateRoot, parentPath);
  if (!isObj(parentObj)) {
    console.error(`[Twine Dugger]: Could not resolve path`, { path: [...parentPath, sourceKey] });
    return;
  }
  // Array
  if (Array.isArray(parentObj)) {
    const value = parentObj[Number(sourceKey)];
    parentObj.push(structuredClone(value));
    return;
  }
  if (!targetKey) {
    console.error('[Twine Dugger]: Duplicate State Property called without targetKey');
    return;
  }
  // Map
  if (parentObj instanceof Map) {
    const value = parentObj.get(`${sourceKey}`);
    parentObj.set(`${targetKey}`, structuredClone(value));
    return;
  }
  // Normal object
  parentObj[`${targetKey}`] = structuredClone(parentObj[`${sourceKey}`]);
}

export function setState(
  stateRoot: ObjectValue | MapValue | ArrayValue,
  path: Array<string | number>,
  value: unknown,
) {
  const objPath = path.slice(0, -1);
  const valueKey = path.at(-1)!;
  const stateObj = getStateValue(stateRoot, objPath) as StateObj;

  if (Array.isArray(stateObj)) {
    stateObj[Number(valueKey)] = value as Value;
  } else if (stateObj instanceof Map) {
    stateObj.set(`${valueKey}`, value as Value);
  } else {
    stateObj[`${valueKey}`] = value as Value;
  }
}

export function deleteFromState(
  stateRoot: ObjectValue | MapValue | ArrayValue,
  path: Array<string | number>,
) {
  const objPath = path.slice(0, -1);
  const valueKey = path.at(-1)!;
  const stateObj = getStateValue(stateRoot, objPath) as StateObj;

  if (Array.isArray(stateObj)) {
    stateObj.splice(Number(valueKey), 1);
  } else if (stateObj instanceof Map) {
    stateObj.delete(`${valueKey}`);
  } else if (typeof stateObj === 'object' && stateObj !== null) {
    delete stateObj[`${valueKey}`];
  } else {
    console.error(`[Twine Dugger]: Could not delete at path`, {
      path,
    });
  }
}
