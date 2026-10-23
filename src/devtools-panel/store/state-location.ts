import { createSignal, untrack } from 'solid-js';

import { trimToExistingPath } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getLatestState } from './game-state';
import { setViewState, store } from './store';

const [revealCount, setRevealCount] = createSignal(0);

/** Counts the times that the State view was asked to scroll the selection into view */
export const getRevealCount = revealCount;

/** The path of the selected value, without the state itself */
export const getStatePath = (): Path => store.viewState.state.path;

/**
 * The one way to select something in the State view. A path that is not in the state is not set:
 * what is selected is always there (when the game removes it, the path is cut, see `game-state.ts`).
 */
export function setStatePath(path: Path): boolean {
  const exists = untrack(() => trimToExistingPath(getLatestState(), path).length === path.length);
  if (exists) setViewState('state', 'path', path);
  return exists;
}

/**
 * For whatever is not a row of the navigator: the breadcrumbs, the diff log, the search. The row
 * that is selected is not necessarily in view then, even when it was selected already. A row that
 * is clicked is in view, so it only sets the path.
 */
// A counter that an effect watches, and a lookup of the row in the DOM: to be reworked for a
// virtualized list (Backlog 29)
export const requestReveal = () => setRevealCount((count) => count + 1);

export function showInStateView(path: Path) {
  if (setStatePath(path)) requestReveal();
}
