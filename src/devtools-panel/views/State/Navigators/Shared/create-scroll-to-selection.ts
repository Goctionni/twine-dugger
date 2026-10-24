import { createEffect } from 'solid-js';

import { getScrollToTrigger } from '@/devtools-panel/store/state-location';
import type { Path } from '@/shared/shared-types';

/**
 * Scrolls the selected row into view when a scroll to it is asked for (the breadcrumbs, the diff log, the
 * keys), and also when the navigator is made. The row of the selection may not be there yet: the
 * rows that hold it can open a moment after the selection is set, so the scroll waits for the row
 * to be shown.
 */
export function createScrollToSelection(
  getContainer: () => HTMLElement | undefined,
  getSelectedPath: () => Path,
  isSelectedRowShown: () => boolean,
) {
  let handledScrollToTrigger = -1;
  let isScrollToPending = false;

  createEffect(
    () => [getScrollToTrigger(), isSelectedRowShown(), getSelectedPath().length === 0] as const,
    ([scrollToTrigger, isShown, isNothingSelected]) => {
      if (scrollToTrigger !== handledScrollToTrigger) {
        handledScrollToTrigger = scrollToTrigger;
        isScrollToPending = true;
      }
      // Nothing is selected: no row to show, and a click later is not a scroll
      if (isNothingSelected) isScrollToPending = false;
      if (!isScrollToPending || !isShown) return;

      isScrollToPending = false;
      getContainer()
        ?.querySelector('[data-selection-state="selected"]')
        ?.scrollIntoView({ block: 'nearest' });
    },
  );
}
