// The same widths as the classes of the column and the strip: a column is never narrower than 230 px
// and a strip is 30 px. They are px, not rem, because the sum has to be what is on the screen.
const COLUMN_MIN_WIDTH = 230;
const STRIP_WIDTH = 30;

/**
 * How many of the columns, from the left, are collapsed into strips: as few as it takes for the
 * rest to fit at their minimum width, and never the last one. The widths of the columns themselves
 * are not calculated: flexbox shares what is left evenly (up to 345 px for all but the last
 * column), and the last column takes the rest.
 * A width of 0 is a pane that was not measured yet, and collapses nothing.
 */
export function countCollapsed(columnCount: number, width: number): number {
  if (width <= 0) return 0;
  let collapsed = 0;
  while (
    collapsed < columnCount - 1 &&
    (columnCount - collapsed) * COLUMN_MIN_WIDTH + collapsed * STRIP_WIDTH > width
  ) {
    collapsed++;
  }
  return collapsed;
}
