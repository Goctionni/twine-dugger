import type { Path } from './shared-types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Sorts an array of paths in a deterministic, depth-first alphabetical/numeric order.
 *
 * Example:
 * Input:  [['state', 'z', 'score'], ['state', 'a', 'name'], ['state', 'a', 'inventory'], ['state', 'b']]
 * Output: [['state', 'a', 'inventory'], ['state', 'a', 'name'], ['state', 'b'], ['state', 'z', 'score']]
 */
export function sortPaths(paths: Path[]): Path[] {
  return [...paths].sort((pathA, pathB) => {
    const minLength = Math.min(pathA.length, pathB.length);

    for (let i = 0; i < minLength; i++) {
      if (pathA[i] !== pathB[i]) {
        return collator.compare(String(pathA[i]), String(pathB[i]));
      }
    }

    return pathA.length - pathB.length;
  });
}
