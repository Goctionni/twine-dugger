import type { Path } from './shared-types';

/**
 * Sorts an array of paths in a deterministic, depth-first alphabetical/numeric order.
 *
 * Example:
 * Input:  [['state', 'z', 'score'], ['state', 'a', 'name'], ['state', 'a', 'inventory'], ['state', 'b']]
 * Output: [['state', 'a', 'inventory'], ['state', 'a', 'name'], ['state', 'b'], ['state', 'z', 'score']]
 */
export function sortPaths(paths: Path[]): Path[] {
  return [...paths].sort((path1, path2) => {
    const minLen = Math.min(path1.length, path2.length);

    for (let i = 0; i < minLen; i++) {
      const item1 = path1[i];
      const item2 = path2[i];

      if (item1 === item2) continue;

      if (typeof item1 === 'number' && typeof item2 === 'number') {
        return item1 - item2;
      }

      if (typeof item1 === 'number') return -1;
      if (typeof item2 === 'number') return 1;

      if (typeof item1 === 'string' && typeof item2 === 'string') {
        return item1.localeCompare(item2);
      }

      return String(item1).localeCompare(String(item2));
    }

    // If all common elements are equal, the shorter path comes first
    return path1.length - path2.length;
  });
}
