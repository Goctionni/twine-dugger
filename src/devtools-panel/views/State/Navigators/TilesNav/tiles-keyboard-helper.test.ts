import { describe, expect, it, vi } from 'vite-plus/test';

import {
  handleGoUpKey,
  handleLeftRightKey,
  handleSelectKey,
  handleUpDownKey,
  isGoUpKey,
  isLeftRightKey,
  isSelectKey,
  isUpDownKey,
  type TilesKeyContext,
} from './tiles-keyboard-helper';

const key = (name: string, init: KeyboardEventInit = {}) =>
  new KeyboardEvent('keydown', { key: name, cancelable: true, ...init });

// Three columns, and the last row has two tiles
//   0 1 2
//   3 4 5
//   6 7
function setup(selectedIndex: number, options: Partial<TilesKeyContext> = {}) {
  return {
    selectedIndex,
    tileCount: 8,
    hasUpTile: false,
    getColumns: () => 3,
    selectTile: vi.fn(),
    activateTile: vi.fn(),
    goUp: vi.fn(),
    ...options,
  } satisfies TilesKeyContext;
}

describe('which key is which', () => {
  it('goes up with backspace, and with shift and up or left', () => {
    expect(isGoUpKey(key('Backspace'))).toBe(true);
    expect(isGoUpKey(key('ArrowUp', { shiftKey: true }))).toBe(true);
    expect(isGoUpKey(key('ArrowLeft', { shiftKey: true }))).toBe(true);
    expect(isGoUpKey(key('ArrowUp'))).toBe(false);
    expect(isGoUpKey(key('ArrowRight', { shiftKey: true }))).toBe(false);
  });

  it('keeps the arrows and enter for themselves when shift is down', () => {
    expect(isSelectKey(key('Enter'))).toBe(true);
    expect(isSelectKey(key('Enter', { shiftKey: true }))).toBe(false);
    expect(isLeftRightKey(key('ArrowLeft'))).toBe(true);
    expect(isLeftRightKey(key('ArrowRight', { shiftKey: true }))).toBe(false);
    expect(isLeftRightKey(key('ArrowUp'))).toBe(false);
    expect(isUpDownKey(key('ArrowDown'))).toBe(true);
    expect(isUpDownKey(key('ArrowDown', { shiftKey: true }))).toBe(false);
    expect(isUpDownKey(key('ArrowLeft'))).toBe(false);
  });
});

describe('handleGoUpKey', () => {
  it('goes up when there is a tile that goes up', () => {
    const context = setup(2, { hasUpTile: true });
    const event = key('Backspace');
    handleGoUpKey(event, context);
    expect(context.goUp).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('does nothing at the top', () => {
    const context = setup(2);
    const event = key('Backspace');
    handleGoUpKey(event, context);
    expect(context.goUp).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('handleSelectKey', () => {
  it('acts on the selected tile, and on nothing when none is selected', () => {
    const context = setup(3);
    handleSelectKey(key('Enter'), context);
    expect(context.activateTile).toHaveBeenCalledWith(3);

    const none = setup(-1);
    handleSelectKey(key('Enter'), none);
    expect(none.activateTile).not.toHaveBeenCalled();
  });
});

describe('handleLeftRightKey', () => {
  const press = (name: string, selectedIndex: number, options?: Partial<TilesKeyContext>) => {
    const context = setup(selectedIndex, options);
    handleLeftRightKey(key(name), context);
    return context.selectTile;
  };

  it('steps through the tiles in order, and stops at the ends', () => {
    expect(press('ArrowRight', 2)).toHaveBeenCalledWith(3);
    expect(press('ArrowLeft', 3)).toHaveBeenCalledWith(2);
    expect(press('ArrowLeft', 0)).toHaveBeenCalledWith(0);
    expect(press('ArrowRight', 7)).toHaveBeenCalledWith(7);
  });

  it('goes to the first value with nothing selected, not to the tile that goes up', () => {
    expect(press('ArrowRight', -1)).toHaveBeenCalledWith(0);
    expect(press('ArrowRight', -1, { hasUpTile: true })).toHaveBeenCalledWith(1);
    // Only the tile that goes up
    expect(press('ArrowRight', -1, { hasUpTile: true, tileCount: 1 })).toHaveBeenCalledWith(0);
  });

  it('does nothing without tiles', () => {
    expect(press('ArrowRight', -1, { tileCount: 0 })).not.toHaveBeenCalled();
  });
});

describe('handleUpDownKey', () => {
  const press = (name: string, selectedIndex: number, options?: Partial<TilesKeyContext>) => {
    const context = setup(selectedIndex, options);
    handleUpDownKey(key(name), context);
    return context.selectTile;
  };

  it('moves a row, in the same column', () => {
    expect(press('ArrowDown', 1)).toHaveBeenCalledWith(4);
    expect(press('ArrowUp', 4)).toHaveBeenCalledWith(1);
    expect(press('ArrowDown', 0)).toHaveBeenCalledWith(3);
  });

  it('goes to the last tile when the row below is shorter, and stays at the top and bottom', () => {
    expect(press('ArrowDown', 5)).toHaveBeenCalledWith(7);
    expect(press('ArrowDown', 7)).toHaveBeenCalledWith(7);
    expect(press('ArrowDown', 6)).toHaveBeenCalledWith(6);
    expect(press('ArrowUp', 1)).toHaveBeenCalledWith(1);
  });

  it('is a list when there is one column', () => {
    expect(press('ArrowDown', 1, { getColumns: () => 1 })).toHaveBeenCalledWith(2);
    expect(press('ArrowUp', 0, { getColumns: () => 1 })).toHaveBeenCalledWith(0);
  });

  it('goes to the first value with nothing selected, and does not ask for the columns', () => {
    const getColumns = vi.fn(() => 3);
    expect(press('ArrowDown', -1, { getColumns })).toHaveBeenCalledWith(0);
    expect(getColumns).not.toHaveBeenCalled();
  });
});
