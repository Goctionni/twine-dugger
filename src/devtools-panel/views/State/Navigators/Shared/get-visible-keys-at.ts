import { getLastChangeId } from '@/devtools-panel/store/game-state';
import { isPinned } from '@/devtools-panel/store/store';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { getSearchMatcher } from '../../state-search';
import { getHiddenKeyCheck, getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import { getVisibleKeys } from './visible-keys';

/**
 * The keys of the container at a path (`container` is its value) as the toolbar has them set: the
 * sort, the type filter, the pins, and by default also the search and the hidden filtered paths.
 * `isSearched: false` is for the grid of the container editor, which shows what it edits.
 */
export function getVisibleKeysAt(
  container: JSONSafeValue,
  containerPath: Path,
  { isSearched = true } = {},
) {
  return getVisibleKeys(
    container,
    getSort(),
    getHiddenTypes(),
    (key) => getLastChangeId([...containerPath, key]),
    (key) => isPinned([...containerPath, key]),
    isSearched ? getSearchMatcher() : undefined,
    isSearched ? getHiddenKeyCheck(containerPath) : undefined,
  );
}
