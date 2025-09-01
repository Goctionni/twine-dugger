import { Show } from 'solid-js';

import { getObjectPathValue } from '@/shared/get-object-path-value';
import { Path } from '@/shared/shared-types';

import { setState } from '../../../api/api';
import { setStatePropertyLock } from '../../../api/api';
import { addLockPath, createGetViewState, getActiveState, removeLockPath } from '../../../store';
import { BooleanInput } from '../../../ui/inputs/BooleanInput';
import { LockButton } from '../../../ui/inputs/LockButton';
import { getLockStatus } from '../lock-helper';

interface StateBooleanInputProps {
  path: Path;
}

export function StateBooleanInput(props: StateBooleanInputProps) {
  const getLockedPaths = createGetViewState('state', 'lockedPaths');
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
    <div class="flex justify-start select-none gap-2">
      <BooleanInput value={currentValue()} onChange={handleChange} disabled={isDisabled()} />

      <Show when={!isReadOnly()}>
        <LockButton status={lockStatus()} onToggle={handleToggleLock} />
      </Show>
    </div>
  );
}
