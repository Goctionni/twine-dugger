import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { Path } from '@/shared/shared-types';

const pathEquals = (a: Path, b: Path) => a.length === b.length && a.every((v, i) => v === b[i]);

let mockGetLockedPaths: () => Path[];
let mockRemoveLockPath: (path: Path) => void;
let mockClearLockPaths: () => void;

vi.mock('@/devtools-panel/store', () => ({
  getLockedPaths: () => mockGetLockedPaths(),
  removeLockPath: (path: Path) => mockRemoveLockPath(path),
  clearLockPaths: () => mockClearLockPaths(),
  getActiveState: () => ({ state: { a: { name: 'test', inventory: [] }, z: { score: 10 } } }),
}));

vi.mock('@/devtools-panel/api/api', () => ({
  setStatePropertyLock: () => {},
  setStatePropertyLocks: () => {},
}));

import { LockSettings } from './LockSettings';

describe('LockSettings', () => {
  const initialPaths: Path[] = [
    ['state', 'z', 'score'],
    ['state', 'a', 'name'],
  ];

  beforeEach(() => {
    const [get, set] = createSignal<Path[]>(initialPaths.map((p) => [...p]));
    mockGetLockedPaths = get;
    mockRemoveLockPath = (path) => set((prev) => prev.filter((p) => !pathEquals(p, path)));
    mockClearLockPaths = () => set([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders initial paths sorted', () => {
    render(() => <LockSettings />);
    expect(screen.getByText(/locked paths/i).textContent).toContain('2');
  });

  it('reactively removes individual path when Unlock is clicked', async () => {
    const user = userEvent.setup();
    render(() => <LockSettings />);

    expect(screen.getByText(/locked paths/i).textContent).toContain('2');

    await user.click(screen.getAllByRole('button', { name: /unlock/i })[0]!);

    expect(screen.getByText(/locked paths/i).textContent).toContain('1');
  });

  it('reactively clears all paths when Clear all is clicked', async () => {
    const user = userEvent.setup();
    render(() => <LockSettings />);

    expect(screen.getByText(/locked paths/i).textContent).toContain('2');

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(screen.getByText(/no locked variables yet/i)).toBeTruthy();
  });
});
