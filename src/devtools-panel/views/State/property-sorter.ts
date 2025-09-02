import { getObjectPathValue } from '@/shared/get-object-path-value';
import { ContainerValue, PropertyOrder } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

export function createSorter(object: ContainerValue, order: PropertyOrder) {
  if (order === 'alphabetic') {
    return (keys: string[]) =>
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
    const getValue = (key: string) => getObjectPathValue(object, [key]);
    return (keys: string[]) => {
      return keys.toSorted((key1, key2) => {
        if (typeof key1 === 'number' && typeof key2 === 'number') return key1 - key2;
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

  return (keys: string[]) => keys;
}
