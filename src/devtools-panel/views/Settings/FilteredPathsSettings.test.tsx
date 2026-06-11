import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { Path } from '@/shared/shared-types';

const pathEquals = (a: Path, b: Path) => a.length === b.length && a.every((v, i) => v === b[i]);

let mockGetFilteredPaths: () => Path[];
let mockRemoveFilteredPath: (path: Path) => void;
let mockClearFilteredPaths: () => void;

vi.mock('@/devtools-panel/store', () => ({
  getFilteredPaths: () => mockGetFilteredPaths(),
  removeFilteredPath: (path: Path) => mockRemoveFilteredPath(path),
  clearFilteredPaths: () => mockClearFilteredPaths(),
  getActiveState: () => ({ state: { a: { name: 'test', inventory: [] }, z: { score: 10 } } }),
}));

import { FilteredPathsSettings } from './FilteredPathsSettings';

describe('FilteredPathsSettings', () => {
  const initialPaths: Path[] = [
    ['state', 'z', 'score'],
    ['state', 'a', 'name'],
  ];

  beforeEach(() => {
    const [get, set] = createSignal<Path[]>(initialPaths.map((p) => [...p]));
    mockGetFilteredPaths = get;
    mockRemoveFilteredPath = (path) => set((prev) => prev.filter((p) => !pathEquals(p, path)));
    mockClearFilteredPaths = () => set([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders initial paths sorted', () => {
    render(() => <FilteredPathsSettings />);
    expect(screen.getByText(/filtered paths/i).textContent).toContain('2');
  });

  it('reactively removes individual path when Remove is clicked', async () => {
    const user = userEvent.setup();
    render(() => <FilteredPathsSettings />);

    expect(screen.getByText(/filtered paths/i).textContent).toContain('2');

    await user.click(screen.getAllByRole('button', { name: /remove/i })[0]!);

    expect(screen.getByText(/filtered paths/i).textContent).toContain('1');
  });

  it('reactively clears all paths when Clear all is clicked', async () => {
    const user = userEvent.setup();
    render(() => <FilteredPathsSettings />);

    expect(screen.getByText(/filtered paths/i).textContent).toContain('2');

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(screen.getByText(/no filtered paths yet/i)).toBeTruthy();
  });
});
