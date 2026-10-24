/**
 * The item that what was typed goes to, as an index in the list (nothing when no item matches).
 * What was typed is in lower case. One letter goes to the next item that starts with it, so that
 * typing it again goes on to the one after. More letters go to the first item that starts with
 * them, and stay on the selected item when that one does. The same letter several times keeps
 * cycling through the items that start with it. The search wraps around.
 */
export function getTypeAheadTarget(
  names: readonly string[],
  selectedIndex: number,
  typed: string,
): number | undefined {
  const starts = (index: number, prefix: string) => names[index]!.toLowerCase().startsWith(prefix);

  const findNextWith = (prefix: string) => {
    // Nothing selected is -1: the search starts at the first item
    const first = selectedIndex + 1;
    for (let step = 0; step < names.length; step++) {
      const index = (first + step) % names.length;
      if (starts(index, prefix)) return index;
    }
    return undefined;
  };

  if (typed.length === 1) return findNextWith(typed);

  if (selectedIndex >= 0 && starts(selectedIndex, typed)) return selectedIndex;
  const first = names.findIndex((_, index) => starts(index, typed));
  if (first >= 0) return first;
  const isOneLetter = typed.replaceAll(typed[0]!, '') === '';
  return isOneLetter ? findNextWith(typed[0]!) : undefined;
}
