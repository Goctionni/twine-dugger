/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { createContextMenuHandlerMock } = vi.hoisted(() => ({
  createContextMenuHandlerMock: vi.fn(),
}));

vi.mock('../ui/util/ContextMenu', () => ({
  createContextMenuHandler: createContextMenuHandlerMock,
}));

vi.mock('./Header', () => ({
  Header: () => <div data-testid="header" />,
}));

import { Layout } from './Layout';

afterEach(() => cleanup());

describe('Layout', () => {
  it('should render header and child content', () => {
    createContextMenuHandlerMock.mockReturnValue(vi.fn());

    render(() => <Layout>content</Layout>);

    expect(screen.getByTestId('header')).toBeTruthy();
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('should create context menu with reload action', () => {
    let menuItems: Array<any> = [];
    const handler = vi.fn();
    createContextMenuHandlerMock.mockImplementation((items: Array<any>) => {
      menuItems = items;
      return handler;
    });

    const { container } = render(() => <Layout>content</Layout>);
    const root = container.querySelector('div.flex.h-screen.flex-col.bg-gray-900.text-gray-100');
    if (!(root instanceof HTMLDivElement)) throw new Error('Expected root layout element');

    fireEvent.contextMenu(root);

    expect(menuItems).toHaveLength(1);
    expect(menuItems[0]?.label).toBe('Reload Twine Dugger');
    expect(handler).toHaveBeenCalled();
  });
});
