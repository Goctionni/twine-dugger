const jsonKey = '____JSON_type';
export function jsonReplacer(_key: string, value: any) {
  if (Array.isArray(value) && value.length === 2) {
    if (value[0] === '(revive:map)') {
      return {
        [jsonKey]: 'MAP',
        entries: value[1],
      };
    } else if (value[0] === '(revive:set)') {
      return {
        [jsonKey]: 'SET',
        values: value[1],
      };
    } else if (value[0] === '(revive:eval)' && value[1] === 'undefined') {
      return { [jsonKey]: 'UNDEFINED' };
    }
  }
  if (value instanceof Map) {
    return {
      [jsonKey]: 'MAP',
      entries: [...value.entries()],
    };
  }
  if (value instanceof Set) {
    return {
      [jsonKey]: 'SET',
      values: [...value],
    };
  }
  return value;
}

export function jsonReviver(_key: string, value: any) {
  if (value && typeof value === 'object' && jsonKey in value) {
    if (value[jsonKey] === 'MAP') {
      return new Map(value.entries);
    } else if (value[jsonKey] === 'SET') {
      return new Set(value.values);
    } else if (value[jsonKey] === 'undefined') {
      return undefined;
    }
  }
  if (Array.isArray(value) && value.length === 2) {
    if (value[0] === '(revive:eval)' && value[1] === 'undefined') return undefined;
  }
  return value;
}
