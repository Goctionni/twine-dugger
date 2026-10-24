import { onCleanup, useContext } from 'solid-js';

import { getTypeAheadTarget } from './get-type-ahead-target';
import { TypeAheadContext } from './type-ahead-context';

// What is typed after a pause is a new search. When nothing matched, the red text stays twice as long
const TYPE_AHEAD_RESET_MS = 500;

interface Options {
  /** The names of the items in the order that they are shown */
  getNames: () => readonly string[];
  /** The index of the selected item, -1 when none is selected */
  getSelectedIndex: () => number;
  selectIndex: (index: number) => void;
}

/** A single printable character: not a shortcut, not a key of a composition */
export function isTypeAheadKey(event: KeyboardEvent) {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.isComposing
  );
}

/**
 * Called by a navigator. Typing selects the first item that starts with what was typed, and what
 * was typed is shown by whoever provides the `TypeAheadContext`. Returns the handler of the keys
 * (see `isTypeAheadKey`).
 */
export function provideTypeAhead({ getNames, getSelectedIndex, selectIndex }: Options) {
  const showTypedText = useContext(TypeAheadContext);
  let typed = '';
  let typedAt = 0;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => {
    clearTimeout(resetTimer);
    showTypedText(undefined);
  });

  return (event: KeyboardEvent) => {
    // A space does not start a search
    if (event.key === ' ' && typed === '') return;
    event.preventDefault();

    const now = performance.now();
    if (now - typedAt > TYPE_AHEAD_RESET_MS) typed = '';
    typedAt = now;
    typed += event.key.toLowerCase();

    const selectedIndex = getSelectedIndex();
    const target = getTypeAheadTarget(getNames(), selectedIndex, typed);
    if (target !== undefined && target !== selectedIndex) selectIndex(target);

    const isMiss = target === undefined;
    showTypedText({ text: typed, isMiss });
    clearTimeout(resetTimer);
    resetTimer = setTimeout(
      () => {
        typed = '';
        showTypedText(undefined);
      },
      isMiss ? TYPE_AHEAD_RESET_MS * 2 : TYPE_AHEAD_RESET_MS,
    );
  };
}
