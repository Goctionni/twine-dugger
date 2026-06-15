import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { setStatePropertyLock, setStatePropertyLocks } from '@/devtools-panel/api/api';
import { clearLockPaths, getLockedPaths, removeLockPath } from '@/devtools-panel/store';

import { LockSettings } from './LockSettings';

vi.mock('@/devtools-panel/store', () => ({
  getLockedPaths: vi.fn(() => [
    ['state', 'z', 'score'],
    ['state', 'a', 'name'],
  ]),
  removeLockPath: vi.fn(),
  clearLockPaths: vi.fn(),
  getActiveState: vi.fn(() => ({
    state: { a: { name: 'test', inventory: [] }, z: { score: 10 } },
  })),
}));

vi.mock('@/devtools-panel/api/api', () => ({
  setStatePropertyLock: vi.fn(),
  setStatePropertyLocks: vi.fn(),
}));

describe('LockSettings', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => cleanup());

  it('renders initial paths sorted', () => {
    render(() => <LockSettings />);
    expect(screen.getByText('Locked paths:').textContent).toContain('2');
  });

  it('Calls methods to unlock a path when Unlock is clicked', async () => {
    const user = userEvent.setup();
    render(() => <LockSettings />);

    const [button] = screen.getAllByRole('button', { name: 'Unlock' });
    await user.click(button!);

    expect(setStatePropertyLock).toHaveBeenCalledWith(['state', 'a', 'name'], false);
    expect(removeLockPath).toHaveBeenCalledWith(['state', 'a', 'name']);
  });

  it('Calls methods to clear locks when Clear all is clicked', async () => {
    const user = userEvent.setup();
    render(() => <LockSettings />);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(setStatePropertyLocks).toHaveBeenCalledWith([]);
    expect(clearLockPaths).toHaveBeenCalled();
  });

  it('If no locks exist, clear button is disabled', async () => {
    vi.mocked(getLockedPaths).mockReturnValue([]);
    render(() => <LockSettings />);

    expect(screen.getByRole('button', { name: 'Clear all' })).toBeDisabled();
  });
});
