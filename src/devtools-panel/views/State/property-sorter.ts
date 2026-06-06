import { getObjectPathValue } from '@/shared/get-object-path-value';
import type { ContainerValue, PropertyOrder } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

type ContainerKey = string | number;

export function createSorter(object: ContainerValue, order: PropertyOrder) {
  if (order === 'alphabetic') {
    return (keys: ContainerKey[]) =>
      keys.toSorted((key1, key2) => {
        if (typeof key1 === 'number' && typeof key2 === 'number') return key1 - key2;
        return `${key1}`.localeCompare(`${key2}`);
      });
  }
  if (order === 'type') {
    const typeOrder = [
      'object',
      'map',
      'array',
      'set',
      'function',
      'string',
      'number',
      'boolean',
      'null',
      'undefined',
      'other',
    ] as const;
    const getValue = (key: ContainerKey) => getObjectPathValue(object, [key]);
    return (keys: ContainerKey[]) => {
      return keys.toSorted((key1, key2) => {
        if (typeof key1 === 'number' && typeof key2 === 'number') return key1 - key2;
        if (typeof key1 === 'number') return -1;
        if (typeof key2 === 'number') return 1;
        const value1 = getValue(key1);
        const value2 = getValue(key2);
        const type1 = getSpecificType(value1);
        const type2 = getSpecificType(value2);
        const result = typeOrder.indexOf(type1) - typeOrder.indexOf(type2);
        if (result !== 0) return result;
        return `${key1}`.localeCompare(`${key2}`);
      });
    };
  }

  return (keys: ContainerKey[]) => keys;
}
