import { ContainerValue, Value } from './shared-types';

export function getObjectPathValue(stateRoot: ContainerValue, path: Array<string | number>): Value {
  let stateObj: Value = stateRoot;
  for (let i = 0; i < path.length; i++) {
    if (typeof stateObj !== 'object') {
      console.error(`[Twine Dugger]: Could not resolve path`, { path });
      return null;
    }

    const key = path[i];
    if (Array.isArray(stateObj)) {
      stateObj = stateObj[Number(key)] as ContainerValue;
    } else if (stateObj instanceof Map) {
      stateObj = stateObj.get(`${key}`) as ContainerValue;
    } else {
      stateObj = stateObj[`${key}`] as ContainerValue;
    }
  }

  return stateObj;
}
