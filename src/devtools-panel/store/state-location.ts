import { createSignal } from 'solid-js';

import type { Path } from '@/shared/shared-types';

import { setViewState } from './store';

const [revealCount, setRevealCount] = createSignal(0);

/** Counts the times that the State view was asked to scroll the selection into view */
export const getRevealCount = revealCount;

/**
 * For whatever is not a row of the navigator: the breadcrumbs, the diff log, the search. The row
 * that is selected is not necessarily in view then, even when it was selected already. A row that
 * is clicked is in view, so it sets the path directly.
 */
// A counter that an effect watches, and a lookup of the row in the DOM: to be reworked for a
// virtualized list (Backlog 29)
export const requestReveal = () => setRevealCount((count) => count + 1);

export function showInStateView(path: Path) {
  setViewState('state', 'path', path);
  requestReveal();
}
