import { getActiveState } from '@/devtools-panel/store/game-state';
import { getJsonType } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

export function isPathEditable(path: Path) {
  let value: unknown = getActiveState();
  for (const key of path) {
    if (getJsonType(value) === 'set') return false;
    if (value === null || typeof value !== 'object') return true;
    value = (value as Record<string | number, unknown>)[key];
  }
  return true;
}
