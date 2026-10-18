import { getContainerKeyLabel, isContainer } from '@/shared/json-safe';
import type { JSONSafeContainer, JSONSafeObject, Path } from '@/shared/shared-types';

/**
 * The names of the keys of the path as the user knows them: a set has no marker at its start.
 * Only for the part of the path that is in the state: the path is never set with something that is
 * not, and is cut when the game removes it, so what is after that has no name here.
 */
export function getPathLabels(state: JSONSafeContainer, path: Path): string[] {
  const labels: string[] = [];
  let parent: JSONSafeContainer = state;
  for (const key of path) {
    // Read first: that is what makes the caller read it again when the key is made or removed
    const child = (parent as JSONSafeObject)[key];
    if (child === undefined && !Object.hasOwn(parent, key)) break;
    labels.push(getContainerKeyLabel(parent, key));
    if (!isContainer(child)) break;
    parent = child;
  }
  return labels;
}
