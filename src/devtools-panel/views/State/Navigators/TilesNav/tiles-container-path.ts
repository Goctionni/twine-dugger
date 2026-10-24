import { getPathValue, isContainer } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { JSONSafeContainer, Path } from '@/shared/shared-types';

/**
 * The container that the tiles show, from the global path (what is selected in the State view). It
 * stays while the global path is one of its tiles, the tile that goes up, or the container itself.
 * Any other global path moved elsewhere and the tiles follow: a container is opened, a value is
 * shown among its siblings.
 */
export function resolveTilesContainerPath(
  state: JSONSafeContainer,
  globalPath: Path,
  tilesContainerPath: Path | undefined,
): Path {
  if (
    tilesContainerPath &&
    isContainer(getPathValue(state, tilesContainerPath)) &&
    isOnTiles(globalPath, tilesContainerPath)
  ) {
    return tilesContainerPath;
  }
  return isContainer(getPathValue(state, globalPath)) ? globalPath : globalPath.slice(0, -1);
}

function isOnTiles(globalPath: Path, tilesContainerPath: Path) {
  const isTile = pathEquals(globalPath.slice(0, -1), tilesContainerPath);
  const isUpTile =
    tilesContainerPath.length > 0 && pathEquals(globalPath, tilesContainerPath.slice(0, -1));
  return pathEquals(globalPath, tilesContainerPath) || isTile || isUpTile;
}
