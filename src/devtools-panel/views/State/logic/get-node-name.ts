import { getContainerKeyLabel, getPathValue, isContainer } from '@/shared/json-safe';
import type { JSONSafeContainer, Path } from '@/shared/shared-types';

/** What a row or a tile calls the value at a path: its key as the user knows it ("State" for the state) */
export function getNodeName(state: JSONSafeContainer, path: Path) {
  if (path.length === 0) return 'State';
  const container = getPathValue(state, path.slice(0, -1));
  const key = path.at(-1)!;
  return isContainer(container) ? getContainerKeyLabel(container, key) : String(key);
}
