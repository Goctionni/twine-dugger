import { isNumberLike } from '@/shared/json-safe';

export function isNumberMap(map: Map<unknown, unknown>) {
  for (const key of map.keys()) if (typeof key === 'number') return true;
  return false;
}

/** Panel paths only hold strings for map keys, so the real key is looked up in the map */
export function resolveMapKey(map: Map<unknown, unknown>, key: string | number) {
  if (map.has(key)) return key;
  if (typeof key === 'number') {
    const stringKey = String(key);
    if (map.has(stringKey)) return stringKey;
    return map.size === 0 || isNumberMap(map) ? key : stringKey;
  }
  if (isNumberLike(key)) {
    const numberKey = Number(key);
    if (map.has(numberKey) || map.size === 0 || isNumberMap(map)) return numberKey;
  }
  return key;
}
