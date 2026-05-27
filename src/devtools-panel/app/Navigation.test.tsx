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

  it('should not jump to search unless both ctrl and f are pressed', () => {
    render(() => <Navigation />);

    fireEvent.keyDown(window, { key: 'f', ctrlKey: false });
    fireEvent.keyDown(window, { key: 'x', ctrlKey: true });

    expect(setNavigationPageMock).not.toHaveBeenCalledWith('search');
  });

  it('should prevent default and stop propagation on ctrl+f', () => {
    render(() => <Navigation />);
    const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    window.dispatchEvent(event);

    expect(setNavigationPageMock).toHaveBeenCalledWith('search');
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('should attach and remove keydown listener with capture option', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(() => <Navigation />);

    const addKeydownCall = addSpy.mock.calls.find((call) => call[0] === 'keydown');
    expect(addKeydownCall?.[2]).toEqual({ capture: true });

    unmount();

    const removeKeydownCall = removeSpy.mock.calls.find((call) => call[0] === 'keydown');
    expect(removeKeydownCall?.[2]).toEqual({ capture: true });

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('should mark active nav item by class name', () => {
    getNavigationPageMock.mockReturnValue('passages');
    const { container } = render(() => <Navigation />);

    const activeButton = container.querySelector('button.active');
    expect(activeButton?.textContent?.includes('Passages')).toBe(true);
  });
});
