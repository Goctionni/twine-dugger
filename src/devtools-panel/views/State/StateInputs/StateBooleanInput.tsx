import { Show } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { setStatePropertyLock } from '@/devtools-panel/api/api';
import {
  addLockPath,
  createGetViewState,
  getActiveState,
  getLockedPaths,
  removeLockPath,
} from '@/devtools-panel/store';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import type { Path } from '@/shared/shared-types';

import { getLockStatus } from '../lock-helper';

interface StateBooleanInputProps {
  path: Path;
}

export function StateBooleanInput(props: StateBooleanInputProps) {
  const getHistoryId = createGetViewState('state', 'historyId');

  const currentValue = () => {
    const activeState = getActiveState();
    if (!activeState) return false;
    const pathValue = getObjectPathValue(activeState, props.path);
    return typeof pathValue === 'boolean' ? pathValue : false;
  };

  const getPath = () => props.path;
  const isReadOnly = () => getHistoryId() !== -1; // Not on latest
  const lockStatus = () => getLockStatus(getPath, getLockedPaths);
  const isDisabled = () => lockStatus() !== 'unlocked' || isReadOnly();
  const getId = () =>
    getPath()
      .join('_')
      .replaceAll(/[^a-zA-z0-9]/g, '_')
      .replaceAll(/_{2,}/g, '_');

  const handleChange = async (newValue: boolean) => {
    const disabled = isDisabled();
    if (disabled) return;

    try {
      await setState(props.path, newValue);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  };

  const handleToggleLock = () => {
    if (lockStatus() === 'locked') {
      setStatePropertyLock(props.path, false);
      removeLockPath(props.path);
    } else if (lockStatus() === 'unlocked') {
      setStatePropertyLock(props.path, true);
      addLockPath(props.path);
    }
  };

  return (
    <div class="flex justify-start gap-2 select-none">
      <BooleanInput
        value={currentValue()}
        onChange={handleChange}
        disabled={isDisabled()}
        id={getId()}
      />

      <Show when={!isReadOnly()}>
        <LockButton status={lockStatus()} onToggle={handleToggleLock} />
      </Show>
    </div>
  );
}
