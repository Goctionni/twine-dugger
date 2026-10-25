import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clearLocks, getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';

import { LockSettings } from './LockSettings';

vi.mock('@/devtools-panel/store/locks', () => ({
  getLockedPaths: vi.fn(() => [
    ['state', 'z', 'score'],
    ['state', 'a', 'name'],
  ]),
  getLock: vi.fn((path: Array<string | number>) =>
    path.at(-1) === 'score' ? { path, value: 10, min: 5, max: 20 } : { path, value: 'test' },
  ),
  setPathLock: vi.fn(),
  clearLocks: vi.fn(),
}));
vi.mock('@/devtools-panel/store/game-state', () => ({
  getLatestState: vi.fn(() => ({
    state: { a: { name: 'test', inventory: [] }, z: { score: 10 } },
  })),
}));

describe('LockSettings', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => cleanup());

  it('renders initial paths sorted', () => {
    render(() => <LockSettings />);
    expect(screen.getByText('Locked paths:').textContent).toContain('2');
  });

  it('shows the value a path is held at, or the range of a number', () => {
    render(() => <LockSettings />);

    expect(screen.getByText('"test"')).toBeTruthy();
    expect(screen.getByText('5 – 20')).toBeTruthy();
    expect(screen.getByText('5 – 20').parentElement!.textContent).toBe('within 5 – 20');
    expect(screen.getByText('"test"').parentElement!.textContent).toBe('at "test"');
  });

  it('Calls methods to unlock a path when Unlock is clicked', async () => {
    const user = userEvent.setup();
    render(() => <LockSettings />);

    const [button] = screen.getAllByRole('button', { name: 'Unlock' });
    await user.click(button!);

    expect(setPathLock).toHaveBeenCalledWith(['state', 'a', 'name'], false);
  });

  it('Calls methods to clear locks when Clear all is clicked', async () => {
    const user = userEvent.setup();
    render(() => <LockSettings />);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(clearLocks).toHaveBeenCalled();
  });

  it('If no locks exist, clear button is disabled', async () => {
    vi.mocked(getLockedPaths).mockReturnValue([]);
    render(() => <LockSettings />);

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Clear all' }).disabled).toBe(
      true,
    );
  });
});
