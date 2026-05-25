/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  createGetViewStateMock,
  createGetSettingMock,
  getActiveStateMock,
  getLockedPathsMock,
  setViewStateMock,
  getObjectPathValueMock,
  setStatePropertyLockMock,
  addLockPathMock,
  removeLockPathMock,
} = vi.hoisted(() => ({
  createGetViewStateMock: vi.fn(),
  createGetSettingMock: vi.fn(),
  getActiveStateMock: vi.fn(),
  getLockedPathsMock: vi.fn(),
  setViewStateMock: vi.fn(),
  getObjectPathValueMock: vi.fn(),
  setStatePropertyLockMock: vi.fn(),
  addLockPathMock: vi.fn(),
  removeLockPathMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  createGetViewState: createGetViewStateMock,
  createGetSetting: createGetSettingMock,
  getActiveState: getActiveStateMock,
  getLockedPaths: getLockedPathsMock,
  setViewState: setViewStateMock,
  addFilteredPath: vi.fn(),
  addLockPath: addLockPathMock,
  removeLockPath: removeLockPathMock,
  isPathFiltered: vi.fn(() => false),
}));

vi.mock('@/shared/get-object-path-value', () => ({
  getObjectPathValue: getObjectPathValueMock,
}));

vi.mock('../../api/api', () => ({
  deleteFromState: vi.fn(),
  duplicateStateProperty: vi.fn(),
  setState: vi.fn(),
  setStatePropertyLock: setStatePropertyLockMock,
}));

vi.mock('../../ui/display/TypeIcon', () => ({
  TypeIcon: () => <span data-testid="type-icon" />,
}));

vi.mock('../../ui/display/PrettyPath', () => ({
  PrettyPath: (props: { path: Array<string | number> }) => <span>{props.path.join('.')}</span>,
}));

vi.mock('../../ui/util/ContextMenu', () => ({
  createContextMenuHandler: () => vi.fn(),
}));

vi.mock('../../ui/util/Prompt', () => ({
  showPromptDialog: vi.fn(async () => null),
}));

vi.mock('./dialogs/AddPropertyDialog', () => ({
  AddPropertyDialog: () => <div />,
}));

vi.mock('./dialogs/DuplicateKeyDialog', () => ({
  DuplicateKeyDialog: () => <div />,
}));

import { ObjectNav } from './ObjectNav';

afterEach(() => cleanup());

describe('ObjectNav', () => {
  beforeEach(() => {
    createGetViewStateMock.mockReset();
    createGetSettingMock.mockReset();
    getActiveStateMock.mockReset();
    getLockedPathsMock.mockReset();
    setViewStateMock.mockReset();
    getObjectPathValueMock.mockReset();
    setStatePropertyLockMock.mockReset();
    addLockPathMock.mockReset();
    removeLockPathMock.mockReset();

    createGetViewStateMock.mockReturnValue(() => []);
    createGetSettingMock.mockReturnValue(() => 'type');
    getActiveStateMock.mockReturnValue({ player: { hp: 10, name: 'Avery' } });
    getLockedPathsMock.mockReturnValue([]);
    getObjectPathValueMock.mockReturnValue({ hp: 10, name: 'Avery' });
  });

  it('should render child properties and update selected path on click', () => {
    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    fireEvent.click(screen.getByText('name'));

    expect(setViewStateMock).toHaveBeenCalledWith('state', 'path', ['player', 'name']);
  });
});
