/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { getNavigationPageMock, setNavigationPageMock } = vi.hoisted(() => ({
  getNavigationPageMock: vi.fn(),
  setNavigationPageMock: vi.fn(),
}));

vi.mock('../store', () => ({
  getNavigationPage: getNavigationPageMock,
  setNavigationPage: setNavigationPageMock,
}));

import { Navigation } from './Navigation';

afterEach(() => cleanup());

describe('Navigation', () => {
  beforeEach(() => {
    getNavigationPageMock.mockReset();
    setNavigationPageMock.mockReset();
    getNavigationPageMock.mockReturnValue('state');
  });

  it('should navigate when nav button is clicked', () => {
    render(() => <Navigation />);
    fireEvent.click(screen.getByRole('button', { name: /Settings/i }));

    expect(setNavigationPageMock).toHaveBeenCalledWith('settings');
  });

  it('should jump to search on ctrl+f keyboard shortcut', () => {
    render(() => <Navigation />);
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

    expect(setNavigationPageMock).toHaveBeenCalledWith('search');
  });

  it('should mark active nav item by class name', () => {
    getNavigationPageMock.mockReturnValue('passages');
    const { container } = render(() => <Navigation />);

    const activeButton = container.querySelector('button.active');
    expect(activeButton?.textContent?.includes('Passages')).toBe(true);
  });
});
