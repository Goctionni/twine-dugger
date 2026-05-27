/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type AnyFn = (...args: any[]) => any;

const { isPathFilteredMock, createContextMenuHandlerMock } = vi.hoisted(() => ({
  isPathFilteredMock: vi.fn<AnyFn>(),
  createContextMenuHandlerMock: vi.fn<AnyFn>(),
}));

vi.mock('@/devtools-panel/store', () => ({
  isPathFiltered: isPathFilteredMock,
}));

vi.mock('@/devtools-panel/ui/display/PrettyPath', () => ({
  PrettyPath: (props: { path: Array<string | number> }) => <span>{props.path.join('.')}</span>,
}));

vi.mock('../../ui/util/ContextMenu', () => ({
  createContextMenuHandler: createContextMenuHandlerMock,
}));

import { DiffPath } from './DiffPath';

afterEach(() => cleanup());

describe('DiffPath', () => {
  beforeEach(() => {
    isPathFilteredMock.mockReset();
    createContextMenuHandlerMock.mockReset();
    isPathFilteredMock.mockReturnValue(false);
    createContextMenuHandlerMock.mockImplementation(() => vi.fn<AnyFn>());
  });

  it('should render full path and trigger click handler', () => {
    const onClick = vi.fn<() => void>();
    const addFilter = vi.fn<(path: Array<string | number>) => void>();

    render(() => (
      <DiffPath path={['player']} leafKey="hp" onClick={onClick} onAddFilter={addFilter} />
    ));
    fireEvent.click(screen.getByText('player.hp'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should build context menu options for each parent path and honor filter disabled state', () => {
    const onAddFilter = vi.fn<(path: Array<string | number>) => void>();
    const onClick = vi.fn<() => void>();
    let menuItems: Array<any> = [];

    createContextMenuHandlerMock.mockImplementation((items: Array<any>) => {
      menuItems = items;
      return vi.fn<AnyFn>();
    });

    isPathFilteredMock.mockImplementation(
      (path: Array<string | number>) => path.join('.') === 'a.b',
    );

    render(() => <DiffPath path={['a', 'b']} onClick={onClick} onAddFilter={onAddFilter} />);

    expect(menuItems).toHaveLength(2);
    menuItems[0].onClick();
    menuItems[1].onClick();

    expect(onAddFilter).toHaveBeenNthCalledWith(1, ['a']);
    expect(onAddFilter).toHaveBeenNthCalledWith(2, ['a', 'b']);
    expect(menuItems[0].disabled()).toBe(false);
    expect(menuItems[1].disabled()).toBe(true);

    render(() => <>{menuItems[1].label()}</>);
    expect(screen.getByText(/Filter out changes to/)).toBeTruthy();
  });
});
