/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { clearFilteredPathsMock, getFilteredPathsMock, removeFilteredPathMock } = vi.hoisted(() => ({
  clearFilteredPathsMock: vi.fn(),
  getFilteredPathsMock: vi.fn(),
  removeFilteredPathMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  clearFilteredPaths: clearFilteredPathsMock,
  getFilteredPaths: getFilteredPathsMock,
  removeFilteredPath: removeFilteredPathMock,
}));

vi.mock('@/devtools-panel/ui/display/PrettyPath', () => ({
  PrettyPath: (props: { path: Array<string | number> }) => <span>{props.path.join('.')}</span>,
}));

import { FilteredPathsSettings } from './FilteredPathsSettings';

afterEach(() => cleanup());

describe('FilteredPathsSettings', () => {
  beforeEach(() => {
    clearFilteredPathsMock.mockReset();
    getFilteredPathsMock.mockReset();
    removeFilteredPathMock.mockReset();
  });

  it('should render empty-state message when no filtered paths exist', () => {
    getFilteredPathsMock.mockReturnValue([]);
    render(() => <FilteredPathsSettings />);

    expect(screen.getByText('No filtered paths yet.')).toBeTruthy();
  });

  it('should render paths and dispatch remove/clear actions', () => {
    getFilteredPathsMock.mockReturnValue([['player', 'hp']]);
    render(() => <FilteredPathsSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(removeFilteredPathMock).toHaveBeenCalledWith(['player', 'hp']);
    expect(clearFilteredPathsMock).toHaveBeenCalledTimes(1);
  });
});
