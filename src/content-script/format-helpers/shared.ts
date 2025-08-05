import { ArrayValue, MapValue, ObjectValue, Value } from '@/shared/shared-types';

export function setState(stateRoot: ObjectValue | MapValue | ArrayValue, path: Array<string | number>, value: unknown) {
  type StateObj = ObjectValue | MapValue | ArrayValue;
  let stateObj: StateObj = stateRoot;

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const isLast = i + 1 === path.length;

    if (Array.isArray(stateObj)) {
      if (!isLast) {
        stateObj = stateObj[Number(key)] as StateObj;
      } else {
        stateObj[Number(key)] = value as Value;
      }
    } else if (stateObj instanceof Map) {
      if (!isLast) {
        stateObj = stateObj.get(`${key}`) as StateObj;
      } else {
        stateObj.set(`${key}`, value as Value);
      }
    } else {
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

export function deleteFromState(stateRoot: ObjectValue | MapValue | ArrayValue, path: Array<string | number>) {
  type StateObj = ObjectValue | MapValue | ArrayValue;
  let stateObj: StateObj = stateRoot;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (Array.isArray(stateObj)) {
      stateObj = stateObj[Number(key)] as StateObj;
    } else if (stateObj instanceof Map) {
      stateObj = stateObj.get(`${key}`) as StateObj;
    } else {
      stateObj = stateObj[`${key}`] as StateObj;
    }

    console.log("cdddddd");

    if (!stateObj || typeof stateObj !== 'object') {
      console.error(`[Twine Dugger]: Could not resolve path to delete`, {
        path,
      });
      return;
    }
  }

  const finalKey = path[path.length - 1];

  if (Array.isArray(stateObj)) {
    stateObj.splice(Number(finalKey), 1);
  } else if (stateObj instanceof Map) {
    stateObj.delete(`${finalKey}`);
  } else if (typeof stateObj === 'object' && stateObj !== null) {
    delete stateObj[`${finalKey}`];
  } else {
    console.error(`[Twine Dugger]: Could not delete at path`, {
      path,
    });
  }
}

export function sanitize(obj: ObjectValue) {
  const result: ObjectValue = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('TwineScript_')) continue;
    if (
      value &&
      typeof value === 'object' &&
      Object.keys(value).some((subkey) => subkey.startsWith('TwineScript_'))
    )
      continue;
    result[key] = value;
  }
  return result;
}

export function ignoreCheck(key: unknown, value: Value) {
  if (typeof key === 'string' && key.startsWith('TwineScript_')) return true;
  if (
    value &&
    typeof value === 'object' &&
    Object.keys(value).some((key) => key.startsWith('TwineScript_'))
  ) {
    return true;
  }
  return false;
}
