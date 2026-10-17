import { getJsonType, getKeyLabel, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, Path } from '@/shared/shared-types';

/** The names of the keys of the path as the user knows them: a set has no marker at its start */
export function getPathLabels(state: JSONSafeValue, path: Path): string[] {
  let value = state;
  return path.map((key) => {
    const type = getJsonType(value);
    value = (value as JSONSafeObject)?.[key];
    return String(isContainerType(type) ? getKeyLabel(type, key) : key);
  });
}
