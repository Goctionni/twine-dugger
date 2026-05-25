/** @vitest-environment jsdom */

import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  createGetViewStateMock,
  getActiveStateMock,
  getLockedPathsMock,
  addLockPathMock,
  removeLockPathMock,
  setStateMock,
  setStatePropertyLockMock,
  booleanInputMock,
  lockButtonMock,
} = vi.hoisted(() => ({
  createGetViewStateMock: vi.fn(),
  getActiveStateMock: vi.fn(),
  getLockedPathsMock: vi.fn(),
  addLockPathMock: vi.fn(),
  removeLockPathMock: vi.fn(),
  setStateMock: vi.fn(async () => undefined),
  setStatePropertyLockMock: vi.fn(),
  booleanInputMock: vi.fn(),
  lockButtonMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  createGetViewState: createGetViewStateMock,
  getActiveState: getActiveStateMock,
  getLockedPaths: getLockedPathsMock,
  addLockPath: addLockPathMock,
  removeLockPath: removeLockPathMock,
}));

vi.mock('@/devtools-panel/api/api', () => ({
  setState: setStateMock,
  setStatePropertyLock: setStatePropertyLockMock,
}));

vi.mock('@/devtools-panel/ui/inputs/BooleanInput', () => ({
  BooleanInput: (props: any) => {
    booleanInputMock(props);
    return <div />;
  },
}));

vi.mock('@/devtools-panel/ui/inputs/LockButton', () => ({
  LockButton: (props: any) => {
    lockButtonMock(props);
    return <div />;
  },
}));

import { StateBooleanInput } from './StateBooleanInput';

afterEach(() => cleanup());

describe('StateBooleanInput', () => {
  beforeEach(() => {
    createGetViewStateMock.mockReset();
    getActiveStateMock.mockReset();
    getLockedPathsMock.mockReset();
    addLockPathMock.mockReset();
    removeLockPathMock.mockReset();
    setStateMock.mockClear();
    setStatePropertyLockMock.mockReset();
    booleanInputMock.mockReset();
    lockButtonMock.mockReset();

    createGetViewStateMock.mockReturnValue(() => -1);
    getActiveStateMock.mockReturnValue({ player: { alive: true } });
    getLockedPathsMock.mockReturnValue([]);
  });

  it('should call setState when boolean value changes', async () => {
    render(() => <StateBooleanInput path={['player', 'alive']} />);
    await booleanInputMock.mock.calls[0]?.[0].onChange(false);

    expect(setStateMock).toHaveBeenCalledWith(['player', 'alive'], false);
  });

  it('should toggle lock state through LockButton callback', () => {
    render(() => <StateBooleanInput path={['player', 'alive']} />);

    lockButtonMock.mock.calls[0]?.[0].onToggle();
    expect(addLockPathMock).toHaveBeenCalledWith(['player', 'alive']);
    expect(setStatePropertyLockMock).toHaveBeenCalledWith(['player', 'alive'], true);
  });
});
