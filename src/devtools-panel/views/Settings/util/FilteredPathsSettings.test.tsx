import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { showInStatePage } from '@/devtools-panel/store/state-location';
import {
  clearFilteredPaths,
  isHiddenInState,
  removeFilteredPath,
} from '@/devtools-panel/store/store';

import { FilteredPathsSettings } from './FilteredPathsSettings';

vi.mock('@/devtools-panel/store/store', () => ({
  getFilteredPaths: vi.fn(() => [
    ['state', 'z', 'score'],
    ['state', 'a', 'name'],
  ]),
  removeFilteredPath: vi.fn(() => vi.fn()),
  clearFilteredPaths: vi.fn(() => vi.fn()),
  isHiddenInState: vi.fn(() => false),
}));
vi.mock('@/devtools-panel/store/state-location', () => ({ showInStatePage: vi.fn() }));
vi.mock('@/devtools-panel/store/game-state', () => ({
  getLatestState: vi.fn(() => ({
    state: { a: { name: 'test', inventory: [] }, z: { score: 10 } },
  })),
}));

describe('FilteredPathsSettings', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => cleanup());

  it('renders initial paths sorted', () => {
    render(() => <FilteredPathsSettings />);
    expect(screen.getByText('Filtered paths:').textContent).toContain('2');
  });

  it('Calls "removeFilteredPath" when Remove is clicked', async () => {
    const user = userEvent.setup();
    render(() => <FilteredPathsSettings />);

    const [button] = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(button!);

    expect(removeFilteredPath).toHaveBeenCalledWith(['state', 'a', 'name']);
  });

  it('Calls "clearFilteredPaths" when Remove is clicked', async () => {
    const user = userEvent.setup();
    render(() => <FilteredPathsSettings />);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(clearFilteredPaths).toHaveBeenCalled();
  });

  it('shows a path in the State view when it is clicked', async () => {
    const user = userEvent.setup();
    render(() => <FilteredPathsSettings />);

    const [button] = screen.getAllByTitle('Show in State view');
    await user.click(button!);

    expect(showInStatePage).toHaveBeenCalledWith(['state', 'a', 'name']);
  });

  it('does not offer that when the State view hides filtered paths', () => {
    vi.mocked(isHiddenInState).mockReturnValue(true);
    render(() => <FilteredPathsSettings />);

    expect(screen.queryByTitle('Show in State view')).toBeNull();
  });
});
