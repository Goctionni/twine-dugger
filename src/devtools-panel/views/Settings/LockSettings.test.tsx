/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  clearLockPathsMock,
  getLockedPathsMock,
  removeLockPathMock,
  setStatePropertyLockMock,
  setStatePropertyLocksMock,
} = vi.hoisted(() => ({
  clearLockPathsMock: vi.fn(),
  getLockedPathsMock: vi.fn(),
  removeLockPathMock: vi.fn(),
  setStatePropertyLockMock: vi.fn(),
  setStatePropertyLocksMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  clearLockPaths: clearLockPathsMock,
  getLockedPaths: getLockedPathsMock,
  removeLockPath: removeLockPathMock,
}));

vi.mock('@/devtools-panel/api/api', () => ({
  setStatePropertyLock: setStatePropertyLockMock,
  setStatePropertyLocks: setStatePropertyLocksMock,
}));

vi.mock('@/devtools-panel/ui/display/PrettyPath', () => ({
  PrettyPath: (props: { path: Array<string | number> }) => <span>{props.path.join('.')}</span>,
}));

import { LockSettings } from './LockSettings';

afterEach(() => cleanup());

describe('LockSettings', () => {
  beforeEach(() => {
    clearLockPathsMock.mockReset();
    getLockedPathsMock.mockReset();
    removeLockPathMock.mockReset();
    setStatePropertyLockMock.mockReset();
    setStatePropertyLocksMock.mockReset();
  });

  it('should show empty-state text when no locked paths exist', () => {
    getLockedPathsMock.mockReturnValue([]);
    render(() => <LockSettings />);

    expect(screen.getByText('No locked variables yet.')).toBeTruthy();
  });

  it('should unlock a single path and clear all locks', () => {
    getLockedPathsMock.mockReturnValue([['player', 'hp']]);
    render(() => <LockSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(setStatePropertyLockMock).toHaveBeenCalledWith(['player', 'hp'], false);
    expect(removeLockPathMock).toHaveBeenCalledWith(['player', 'hp']);
    expect(setStatePropertyLocksMock).toHaveBeenCalledWith([]);
    expect(clearLockPathsMock).toHaveBeenCalledTimes(1);
  });
});
