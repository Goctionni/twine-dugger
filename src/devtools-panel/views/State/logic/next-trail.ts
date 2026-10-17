import type { Path } from '@/shared/shared-types';

/**
 * The deepest path that was walked: it stays while the path is only its start (going up, or back
 * along it), and is replaced by the path when that goes deeper or somewhere else.
 */
export function nextTrail(trail: Path, path: Path): Path {
  return path.every((key, index) => trail[index] === key) ? trail : path;
}
