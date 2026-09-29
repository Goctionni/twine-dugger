import { getLastChangeId } from '@/devtools-panel/store/store';
import { getJsonType } from '@/shared/json-safe';
import type { Path, PropertyOrder, ValueType } from '@/shared/shared-types';

type ContainerKey = string | number;

type Sorter = (keys: ContainerKey[]) => ContainerKey[];

const typeOrder: ValueType[] = [
  'object',
  'map',
  'array',
  'set',
  'function',
  'date',
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'other',
];

/** Reads through `container`, so call the returned sorter in a tracking scope */
export function createSorter(
  container: unknown,
  order: PropertyOrder,
  desc: boolean,
  path: Path,
): Sorter {
  if (desc) {
    const sorter = createSorter(container, order, false, path);
    return (keys) => sorter(keys).toReversed();
  }
  if (order === 'most-recent') {
    return (keys) =>
      keys
        .map((key) => ({ key, changedAt: getLastChangeId([...path, key]) }))
        .toSorted((a, b) => b.changedAt - a.changedAt)
        .map(({ key }) => key);
  }
  if (order === 'alphabetic') {
    return (keys) =>
      keys.toSorted((key1, key2) => {
        if (typeof key1 === 'number' && typeof key2 === 'number') return key1 - key2;
        return `${key1}`.localeCompare(`${key2}`);
      });
  }
  if (order === 'type') {
    const getType = (key: ContainerKey) =>
      getJsonType((container as Record<ContainerKey, unknown>)[key]);
    return (keys) =>
      keys.toSorted((key1, key2) => {
        if (typeof key1 === 'number' && typeof key2 === 'number') return key1 - key2;
        if (typeof key1 === 'number') return -1;
        if (typeof key2 === 'number') return 1;
        const result = typeOrder.indexOf(getType(key1)) - typeOrder.indexOf(getType(key2));
        if (result !== 0) return result;
        return `${key1}`.localeCompare(`${key2}`);
      });
  }

  return (keys) => keys;
}
