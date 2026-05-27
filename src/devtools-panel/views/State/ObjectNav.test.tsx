/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  addFilteredPathMock,
  addLockPathMock,
  createContextMenuHandlerMock,
  createGetSettingMock,
  createGetViewStateMock,
  deleteFromStateMock,
  duplicateStatePropertyMock,
  getActiveStateMock,
  getLockedPathsMock,
  getObjectPathValueMock,
  isPathFilteredMock,
  removeLockPathMock,
  setStateMock,
  setStatePropertyLockMock,
  setViewStateMock,
  showPromptDialogMock,
} = vi.hoisted(() => ({
  addFilteredPathMock: vi.fn(),
  addLockPathMock: vi.fn(),
  createContextMenuHandlerMock: vi.fn(),
  createGetSettingMock: vi.fn(),
  createGetViewStateMock: vi.fn(),
  deleteFromStateMock: vi.fn(),
  duplicateStatePropertyMock: vi.fn(),
  getActiveStateMock: vi.fn(),
  getLockedPathsMock: vi.fn(),
  getObjectPathValueMock: vi.fn(),
  isPathFilteredMock: vi.fn(),
  removeLockPathMock: vi.fn(),
  setStateMock: vi.fn(),
  setStatePropertyLockMock: vi.fn(),
  setViewStateMock: vi.fn(),
  showPromptDialogMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  addFilteredPath: addFilteredPathMock,
  addLockPath: addLockPathMock,
  createGetSetting: createGetSettingMock,
  createGetViewState: createGetViewStateMock,
  getActiveState: getActiveStateMock,
  getLockedPaths: getLockedPathsMock,
  isPathFiltered: isPathFilteredMock,
  removeLockPath: removeLockPathMock,
  setViewState: setViewStateMock,
}));

vi.mock('@/shared/get-object-path-value', () => ({
  getObjectPathValue: getObjectPathValueMock,
}));

vi.mock('../../api/api', () => ({
  deleteFromState: deleteFromStateMock,
  duplicateStateProperty: duplicateStatePropertyMock,
  setState: setStateMock,
  setStatePropertyLock: setStatePropertyLockMock,
}));

vi.mock('../../ui/display/TypeIcon', () => ({
  TypeIcon: () => <span data-testid="type-icon" />,
}));

vi.mock('../../ui/display/PrettyPath', () => ({
  PrettyPath: (props: { path: Array<string | number> }) => <span>{props.path.join('.')}</span>,
}));

vi.mock('../../ui/util/ContextMenu', () => ({
  createContextMenuHandler: createContextMenuHandlerMock,
}));

vi.mock('../../ui/util/Prompt', () => ({
  showPromptDialog: showPromptDialogMock,
}));

vi.mock('./dialogs/AddPropertyDialog', () => ({
  AddPropertyDialog: () => <div data-testid="add-property-dialog" />,
}));

vi.mock('./dialogs/DuplicateKeyDialog', () => ({
  DuplicateKeyDialog: () => <div data-testid="duplicate-key-dialog" />,
}));

import { ObjectNav } from './ObjectNav';

afterEach(() => cleanup());

describe('ObjectNav', () => {
  let currentPath: Array<string | number>;
  let capturedMenuItems: Array<any> = [];

  beforeEach(() => {
    addFilteredPathMock.mockReset();
    addLockPathMock.mockReset();
    createContextMenuHandlerMock.mockReset();
    createGetSettingMock.mockReset();
    createGetViewStateMock.mockReset();
    deleteFromStateMock.mockReset();
    duplicateStatePropertyMock.mockReset();
    getActiveStateMock.mockReset();
    getLockedPathsMock.mockReset();
    getObjectPathValueMock.mockReset();
    isPathFilteredMock.mockReset();
    removeLockPathMock.mockReset();
    setStateMock.mockReset();
    setStatePropertyLockMock.mockReset();
    setViewStateMock.mockReset();
    showPromptDialogMock.mockReset();

    currentPath = [];
    createGetViewStateMock.mockImplementation((view: string, property: string) => {
      if (view === 'state' && property === 'path') return () => currentPath;
      return () => undefined;
    });
    createGetSettingMock.mockReturnValue(() => 'type');
    capturedMenuItems = [];
    createContextMenuHandlerMock.mockImplementation((items) => {
      if (capturedMenuItems.length === 0) capturedMenuItems = items;
      return vi.fn();
    });
    getActiveStateMock.mockReturnValue({ player: { hp: 10, name: 'Avery' } });
    getLockedPathsMock.mockReturnValue([]);
    getObjectPathValueMock.mockReturnValue({ hp: 10, name: 'Avery' });
    isPathFilteredMock.mockReturnValue(false);
    showPromptDialogMock.mockResolvedValue(null);
  });

  it('should update selected path when child item is clicked', () => {
    currentPath = ['player', 'hp'];
    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    fireEvent.click(screen.getByText('name'));

    expect(setViewStateMock).toHaveBeenCalledWith('state', 'path', ['player', 'name']);
  });

  it('should navigate to parent path when clicked item already selected', () => {
    currentPath = ['player', 'name'];
    render(() => <ObjectNav path={['player']} selectedProperty="name" />);

    fireEvent.click(screen.getByText('name'));

    expect(setViewStateMock).toHaveBeenCalledWith('state', 'path', ['player']);
  });

  it('should set state when add new prompt returns property name and value', async () => {
    showPromptDialogMock.mockResolvedValueOnce({ name: 'mana', value: 50 });
    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    fireEvent.click(screen.getByText('Add new...'));
    await Promise.resolve();

    expect(setStateMock).toHaveBeenCalledWith(['player', 'mana'], 50);
  });

  it('should not set state when add prompt result has no property name', async () => {
    showPromptDialogMock.mockResolvedValueOnce({ name: '', value: 50 });
    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    fireEvent.click(screen.getByText('Add new...'));
    await Promise.resolve();

    expect(setStateMock).not.toHaveBeenCalled();
  });

  it('should duplicate object property with prompted target key', async () => {
    showPromptDialogMock.mockResolvedValueOnce('hp_copy');
    createContextMenuHandlerMock.mockImplementationOnce((items) =>
      vi.fn((event: Event) => {
        event.preventDefault();
        items[2]?.onClick();
      }),
    );

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    fireEvent.contextMenu(screen.getByText('hp').closest('li') as HTMLElement);
    await Promise.resolve();

    expect(duplicateStatePropertyMock).toHaveBeenCalledWith(['player'], 'hp', 'hp_copy');
  });

  it('should not duplicate object property when prompt returns empty key', async () => {
    showPromptDialogMock.mockResolvedValueOnce('');
    createContextMenuHandlerMock.mockImplementationOnce((items) =>
      vi.fn((event: Event) => {
        event.preventDefault();
        items[2]?.onClick();
      }),
    );

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    fireEvent.contextMenu(screen.getByText('hp').closest('li') as HTMLElement);
    await Promise.resolve();

    expect(duplicateStatePropertyMock).not.toHaveBeenCalled();
  });

  it('should duplicate array item without prompting for target key', async () => {
    getObjectPathValueMock.mockReturnValue(['x', 'y']);
    createContextMenuHandlerMock.mockImplementationOnce((items) =>
      vi.fn((event: Event) => {
        event.preventDefault();
        items[2]?.onClick();
      }),
    );

    render(() => <ObjectNav path={['inventory']} selectedProperty={0} />);

    fireEvent.contextMenu(screen.getByText('0').closest('li') as HTMLElement);
    await Promise.resolve();

    expect(showPromptDialogMock).not.toHaveBeenCalled();
    expect(duplicateStatePropertyMock).toHaveBeenCalledWith(['inventory'], 0);
  });

  it('should delete selected path from context menu action', async () => {
    createContextMenuHandlerMock.mockImplementationOnce((items) =>
      vi.fn((event: Event) => {
        event.preventDefault();
        items[3]?.onClick();
      }),
    );

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    fireEvent.contextMenu(screen.getByText('hp').closest('li') as HTMLElement);
    await Promise.resolve();

    expect(deleteFromStateMock).toHaveBeenCalledWith(['player', 'hp']);
  });

  it('should lock path from context menu when unlocked', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    expect(capturedMenuItems[0]?.disabled()).toBe(false);
    render(() => <>{capturedMenuItems[0]?.label()}</>);
    expect(screen.getByText(/^Lock\s+"/)).toBeTruthy();
    expect(screen.queryByText(/^Unlock\s+"/)).toBeFalsy();

    capturedMenuItems[0]?.onClick();

    expect(setStatePropertyLockMock).toHaveBeenCalledWith(['player', 'hp'], true);
    expect(addLockPathMock).toHaveBeenCalledWith(['player', 'hp']);
    expect(removeLockPathMock).not.toHaveBeenCalled();
  });

  it('should unlock path from context menu when path is locked', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    getLockedPathsMock.mockReturnValue([['player', 'hp']]);

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    expect(capturedMenuItems[0]?.disabled()).toBe(false);
    render(() => <>{capturedMenuItems[0]?.label()}</>);
    expect(screen.getByText(/^Unlock\s+"/)).toBeTruthy();
    expect(screen.queryByText(/^Lock\s+"/)).toBeFalsy();

    capturedMenuItems[0]?.onClick();

    expect(setStatePropertyLockMock).toHaveBeenCalledWith(['player', 'hp'], false);
    expect(removeLockPathMock).toHaveBeenCalledWith(['player', 'hp']);
  });

  it('should disable lock and duplicate actions when path has ancestor lock', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    getLockedPathsMock.mockReturnValue([['player']]);

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    expect(capturedMenuItems[0]?.disabled()).toBe(true);
    expect(capturedMenuItems[2]?.disabled()).toBe(true);
    expect(capturedMenuItems[3]?.disabled()).toBe(true);
  });

  it('should call addFilteredPath when filter action selected and not already filtered', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    isPathFilteredMock.mockReturnValue(false);

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    expect(capturedMenuItems[1]?.disabled()).toBe(false);
    capturedMenuItems[1]?.onClick();

    expect(addFilteredPathMock).toHaveBeenCalledWith(['player', 'hp']);
  });

  it('should disable filter action when path already filtered', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    isPathFilteredMock.mockReturnValue(true);

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    expect(capturedMenuItems[1]?.disabled()).toBe(true);
  });

  it('should enable duplicate/delete actions when path is unlocked', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    getLockedPathsMock.mockReturnValue([]);

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    expect(capturedMenuItems[2]?.disabled()).toBe(false);
    expect(capturedMenuItems[3]?.disabled()).toBe(false);

    render(() => <>{capturedMenuItems[2]?.label()}</>);
    expect(screen.getByText(/^Duplicate\s+"/)).toBeTruthy();

    render(() => <>{capturedMenuItems[3]?.label()}</>);
    expect(screen.getByText(/^Delete\s+"/)).toBeTruthy();
  });

  it('should disable delete when path is locked but still allow duplicate', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    getLockedPathsMock.mockReturnValue([['player', 'hp']]);

    render(() => <ObjectNav path={['player']} selectedProperty="hp" />);

    expect(capturedMenuItems[2]?.disabled()).toBe(false);
    expect(capturedMenuItems[3]?.disabled()).toBe(true);
  });

  it('should render lock icon only for locked and ancestor-lock states', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });

    const initialView = render(() => <ObjectNav path={['player']} selectedProperty="hp" />);
    expect(initialView.container.textContent?.includes('🔒')).toBe(false);
    initialView.unmount();

    getLockedPathsMock.mockReturnValue([['player', 'hp']]);
    const lockedView = render(() => <ObjectNav path={['player']} selectedProperty="hp" />);
    expect(lockedView.container.textContent?.includes('🔒')).toBe(true);
    expect(lockedView.container.querySelector('.saturate-0')).toBeFalsy();
    lockedView.unmount();

    getLockedPathsMock.mockReturnValue([['player']]);
    const ancestorView = render(() => <ObjectNav path={['player']} selectedProperty="hp" />);
    expect(ancestorView.container.textContent?.includes('🔒')).toBe(true);
    expect(ancestorView.container.querySelector('.saturate-0')).toBeTruthy();
  });
});
