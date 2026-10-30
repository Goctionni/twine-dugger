/** What the keys of the tiles need to know of the navigator, and the ways that they act on it */
export interface TilesKeyContext {
  /** The index of the selected tile in the list of tiles, -1 when no tile is selected */
  selectedIndex: number;
  tileCount: number;
  /** The first tile is the one that goes up */
  hasUpTile: boolean;
  /** How many tiles are in a row; asked only when it is needed */
  getColumns: () => number;
  /** Selects the tile at an index, and shows it */
  selectTile: (index: number) => void;
  /** Opens the container at an index, or goes up when it is the tile that goes up */
  activateTile: (index: number) => void;
  goUp: () => void;
}

export function isGoUpKey(event: KeyboardEvent) {
  return (
    event.key === 'Backspace' ||
    (event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowLeft'))
  );
}

export function handleGoUpKey(event: KeyboardEvent, { hasUpTile, goUp }: TilesKeyContext) {
  if (!hasUpTile) return;
  event.preventDefault();
  goUp();
}

export function isSelectKey(event: KeyboardEvent) {
  return event.key === 'Enter' && !event.shiftKey;
}

export function handleSelectKey(
  event: KeyboardEvent,
  { selectedIndex, activateTile }: TilesKeyContext,
) {
  if (selectedIndex < 0) return;
  event.preventDefault();
  activateTile(selectedIndex);
}

export function isLeftRightKey(event: KeyboardEvent) {
  return !event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight');
}

/** Steps through the tiles in the order that they are shown, and stops at the ends */
export function handleLeftRightKey(event: KeyboardEvent, context: TilesKeyContext) {
  selectTileFor(event, context, (selectedIndex) =>
    event.key === 'ArrowLeft'
      ? Math.max(0, selectedIndex - 1)
      : Math.min(context.tileCount - 1, selectedIndex + 1),
  );
}

export function isUpDownKey(event: KeyboardEvent) {
  return !event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown');
}

/**
 * Moves a row. Down from a row above a shorter last row goes to the last tile; at the top and at
 * the bottom the key stays where it is.
 */
export function handleUpDownKey(event: KeyboardEvent, context: TilesKeyContext) {
  selectTileFor(event, context, (selectedIndex) => {
    const columns = context.getColumns();
    const last = context.tileCount - 1;
    if (event.key === 'ArrowUp') {
      return selectedIndex >= columns ? selectedIndex - columns : selectedIndex;
    }
    if (selectedIndex + columns <= last) return selectedIndex + columns;
    const isInLastRow = Math.floor(selectedIndex / columns) === Math.floor(last / columns);
    return isInLastRow ? selectedIndex : last;
  });
}

// With no tile selected a key goes to the first value, not to the tile that goes up
function selectTileFor(
  event: KeyboardEvent,
  context: TilesKeyContext,
  getTargetIndex: (selectedIndex: number) => number,
) {
  event.preventDefault();
  if (context.tileCount === 0) return;
  const first = Math.min(context.hasUpTile ? 1 : 0, context.tileCount - 1);
  context.selectTile(context.selectedIndex < 0 ? first : getTargetIndex(context.selectedIndex));
}
