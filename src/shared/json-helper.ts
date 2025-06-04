export function jsonReplacer(_key: string, value: any) {
  if (Array.isArray(value) && value.length === 2) {
    if (value[0] === '(revive:map)') {
      return {
        ['____JSON_type']: 'MAP',
        entries: value[1],
      };
    } else if (value[0] === '(revive:set)') {
      return {
        ['____JSON_type']: 'SET',
        values: value[1],
      };
    } else if (value[0] === '(revive:eval)' && value[1] === 'undefined') {
      return { ['____JSON_type']: 'UNDEFINED' };
    }
  }
  if (value instanceof Map) {
    return {
      ['____JSON_type']: 'MAP',
      entries: [...value.entries()],
    };
  }
  if (value instanceof Set) {
    return {
      ['____JSON_type']: 'SET',
      values: [...value],
    };
  }
  return value;
}

export function jsonReviver(_key: string, value: any) {
  if (value && typeof value === 'object' && '____JSON_type' in value) {
    if (value['____JSON_type'] === 'MAP') {
      return new Map(value.entries);
    } else if (value['____JSON_type'] === 'SET') {
      return new Set(value.values);
    } else if (value['____JSON_type'] === 'undefined') {
      return undefined;
    }
  }
  if (Array.isArray(value) && value.length === 2) {
    if (value[0] === '(revive:eval)' && value[1] === 'undefined') return undefined;
  }
  return value;
}
