import { getPotentialId } from '@/shared/id-helper';
import { ContainerValue,SetValue } from '@/shared/shared-types';

import { ChildKey } from '../types';

export function getContainerItem(container: ContainerValue | SetValue, key: string | number) {
  if (Array.isArray(container)) {
    const index = typeof key === 'number' ? key : Number(key);
    return container[index];
  }
  if (container instanceof Set) {
    if (container.has(key)) return key;
    return container.values().find((value) => getPotentialId(value) === key);
  }
  if (container instanceof Map) {
    return container.get(key.toString());
  }
  return container[key] || container[key.toString()];
}

export function compareChildKeys(key1: ChildKey, key2: ChildKey) {
  const k1IsObj = ['object', 'map'].includes(key1.type);
  const k2IsObj = ['object', 'map'].includes(key2.type);
  if (k1IsObj !== k2IsObj) return k1IsObj ? -1 : 1;
  const k1IsArr = key1.type === 'array';
  const k2IsArr = key2.type === 'array';
  if (k1IsArr !== k2IsArr) return k1IsArr ? -1 : 1;
  const k1IsSet = key1.type === 'set';
  const k2IsSet = key2.type === 'set';
  if (k1IsSet !== k2IsSet) return k1IsSet ? -1 : 1;
  if (typeof key1.text !== typeof key2.text) return 0;
  if (typeof key1.text === 'number') return key1.text - Number(key2.text);
  return `${key1.text}`.localeCompare(`${key2.text}`);
}
