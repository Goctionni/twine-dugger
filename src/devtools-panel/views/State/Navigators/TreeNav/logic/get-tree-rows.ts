import { isContainer } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';
import type { JSONSafeObject, JSONSafeValue, Path } from '@/shared/shared-types';

export interface TreeRow {
  /** The key of the path: it tells rows apart, also when a row moves */
  id: string;
  path: Path;
  /** 1 for the values in the state itself */
  level: number;
}

/**
 * The rows of the tree, from the top: the keys of each container, and beneath a container that is
 * expanded, the rows of its own keys. `getKeys` has the keys of the container at a path, in the
 * order that it shows them. Without `showValues` only the containers have a row.
 */
export function getTreeRows(
  state: JSONSafeValue,
  isExpanded: (id: string) => boolean,
  getKeys: (containerPath: Path) => Array<string | number>,
  showValues = true,
): TreeRow[] {
  const rows: TreeRow[] = [];

  const addRowsOf = (container: JSONSafeValue, containerPath: Path) => {
    for (const key of getKeys(containerPath)) {
      const value = (container as JSONSafeObject)[key];
      if (!showValues && !isContainer(value)) continue;

      const path = [...containerPath, key];
      const id = pathKey(path);
      rows.push({ id, path, level: path.length });
      if (isContainer(value) && isExpanded(id)) addRowsOf(value, path);
    }
  };
  addRowsOf(state, []);

  return rows;
}

export const sameRows = (a: readonly TreeRow[], b: readonly TreeRow[]) =>
  a.length === b.length && a.every((row, index) => row.id === b[index]!.id);
