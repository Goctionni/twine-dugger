import { Path } from './shared-types';

export function pathEquals(path1: Path, path2: Path) {
  if (path1.length !== path2.length) return false;
  for (let i = 0; i < path1.length; i++) {
    if (path1[i] !== path2[i]) return false;
  }
  return true;
}
