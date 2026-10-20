import { deleteFromState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { getJsonType, getPathValue, isContainer } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { confirmDelete } from './confirmDelete';

/** Asks first. The view trims the selected path by itself when the value is gone */
export async function deleteValue(path: Path, name: string) {
  const parent = getPathValue(getLatestState(), path.slice(0, -1));
  const isArrayItem = getJsonType(parent) === 'array';
  const hasContents = isContainer(getPathValue(getLatestState(), path));
  if (await confirmDelete(name, { isArrayItem, hasContents })) await deleteFromState(path);
}
