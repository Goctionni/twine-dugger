/**
 * The columns of a row of the grid: the name, the value, and delete. Rows are positioned one by one
 * by the virtual list, so they cannot share columns the way a subgrid does: the width of the name
 * column is the same custom property on all of them.
 */
export const rowColumnsClass = 'grid grid-cols-[var(--name-column)_minmax(0,1fr)_auto]';

// Room next to the characters of a name in its label: checkbox, paddings, gap and the changed dot
const LABEL_EXTRA_REM = 3.5;
// A letter of the monospace font of a name (text-sm) is about 0.6em wide
const CHARACTER_REM = 0.6 * 0.875;

/**
 * The width of the column of the names. Text names can be long, so they get a share of the row.
 * Numbers (the positions in an array, the items of a set) are short and as wide as the highest.
 */
export function getNameColumn(keys: ReadonlyArray<string | number>) {
  const isNumbered = keys.length > 0 && keys.every((key) => /^\d+$/.test(String(key)));
  if (!isNumbered) return '40%';
  const characters = Math.max(...keys.map((key) => String(key).length));
  return `${(characters * CHARACTER_REM + LABEL_EXTRA_REM).toFixed(3)}rem`;
}
