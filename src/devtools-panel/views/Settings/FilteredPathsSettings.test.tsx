import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clearFilteredPaths, removeFilteredPath } from '@/devtools-panel/store';

import { FilteredPathsSettings } from './FilteredPathsSettings';

vi.mock('@/devtools-panel/store', () => ({
  getFilteredPaths: vi.fn(() => [
    ['state', 'z', 'score'],
    ['state', 'a', 'name'],
  ]),
  removeFilteredPath: vi.fn(() => vi.fn()),
  clearFilteredPaths: vi.fn(() => vi.fn()),
  getActiveState: vi.fn(() => ({
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
});
