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
  numberInputMock,
  saveButtonMock,
  lockButtonMock,
} = vi.hoisted(() => ({
  createGetViewStateMock: vi.fn<(...args: any[]) => any>(),
  getActiveStateMock: vi.fn<(...args: any[]) => any>(),
  getLockedPathsMock: vi.fn<(...args: any[]) => any>(),
  addLockPathMock: vi.fn<(...args: any[]) => any>(),
  removeLockPathMock: vi.fn<(...args: any[]) => any>(),
  setStateMock: vi.fn<(...args: any[]) => any>(async () => undefined),
  setStatePropertyLockMock: vi.fn<(...args: any[]) => any>(),
  numberInputMock: vi.fn<(...args: any[]) => any>(),
  saveButtonMock: vi.fn<(...args: any[]) => any>(),
  lockButtonMock: vi.fn<(...args: any[]) => any>(),
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

vi.mock('@/devtools-panel/ui/inputs/NumberInput', () => ({
  NumberInput: (props: any) => {
    numberInputMock(props);
    return <div />;
  },
}));

vi.mock('@/devtools-panel/ui/inputs/SaveButton', () => ({
  SaveButton: (props: any) => {
    saveButtonMock(props);
    return <div />;
  },
}));

vi.mock('@/devtools-panel/ui/inputs/LockButton', () => ({
  LockButton: (props: any) => {
    lockButtonMock(props);
    return <div />;
  },
}));

import { StateNumberInput } from './StateNumberInput';

afterEach(() => cleanup());

describe('StateNumberInput', () => {
  beforeEach(() => {
    createGetViewStateMock.mockReset();
    getActiveStateMock.mockReset();
    getLockedPathsMock.mockReset();
    addLockPathMock.mockReset();
    removeLockPathMock.mockReset();
    setStateMock.mockClear();
    setStatePropertyLockMock.mockReset();
    numberInputMock.mockReset();
    saveButtonMock.mockReset();
    lockButtonMock.mockReset();

    createGetViewStateMock.mockReturnValue(() => -1);
    getActiveStateMock.mockReturnValue({ player: { hp: 10 } });
    getLockedPathsMock.mockReturnValue([]);
  });

  it('should save entered value when SaveButton callback is used', async () => {
    render(() => <StateNumberInput path={['player', 'hp']} />);

    numberInputMock.mock.calls[0]?.[0].onChange(20);
    await saveButtonMock.mock.calls[0]?.[0].onClick();

    expect(setStateMock).toHaveBeenCalledWith(['player', 'hp'], 20);
  });

  it('should toggle lock state when LockButton callback is used', () => {
    render(() => <StateNumberInput path={['player', 'hp']} />);

    lockButtonMock.mock.calls[0]?.[0].onToggle();

    expect(addLockPathMock).toHaveBeenCalledWith(['player', 'hp']);
    expect(setStatePropertyLockMock).toHaveBeenCalledWith(['player', 'hp'], true);
  });
});
