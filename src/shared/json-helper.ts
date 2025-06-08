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
    } else if (value[0] === '(revive:eval)') {
      if (value[1] === 'undefined') {
        return { [jsonKey]: 'UNDEFINED' };
      }
      const fnSyntax1 =
        /^\(\s*(function\s*)?\s*(?<name>[a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\((?<args>.*)\)\s*(\{.*\})\)$/g;
      const fnSyntax2 = /^\(\s*\((?<args>.*)\)\s*\=\>.*\)$/g;
      const matches = fnSyntax1.exec(value[1]) || fnSyntax2.exec(value[1]);
      if (matches) return { [jsonKey]: 'function' };
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
    } else if (value[jsonKey] === 'function') {
      return () => {};
    }
  }
  if (Array.isArray(value) && value.length === 2) {
    if (value[0] === '(revive:eval)' && value[1] === 'undefined') return undefined;
  }
  return value;
}
