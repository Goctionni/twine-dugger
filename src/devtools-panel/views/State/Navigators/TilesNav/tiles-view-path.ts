import { getPathValue, isContainer } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { JSONSafeContainer, Path } from '@/shared/shared-types';

/**
 * The container that the tiles show. It stays while the selection is one of its tiles, the tile
 * that goes up, or the container itself. Any other selection moved elsewhere and the tiles follow:
 * a container is opened, a value is shown among its siblings.
 */
export function resolveTilesViewPath(
  state: JSONSafeContainer,
  selection: Path,
  view: Path | undefined,
): Path {
  if (view && isContainer(getPathValue(state, view)) && isOnTiles(selection, view)) return view;
  return isContainer(getPathValue(state, selection)) ? selection : selection.slice(0, -1);
}

function isOnTiles(selection: Path, view: Path) {
  const isChild = pathEquals(selection.slice(0, -1), view);
  const isUp = view.length > 0 && pathEquals(selection, view.slice(0, -1));
  return pathEquals(selection, view) || isChild || isUp;
}
