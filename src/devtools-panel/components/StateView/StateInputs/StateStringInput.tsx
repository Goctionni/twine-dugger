import { createEffect, createSignal, Show } from 'solid-js';

import { getObjectPathValue } from '@/shared/get-object-path-value';
import { Path } from '@/shared/shared-types';

import {
  addLockPath,
  createGetViewState,
  getActiveState,
  removeLockPath,
} from '../../../store/store';
import { setState, setStatePropertyLock } from '../../../utils/api';
import { getLockStatus } from '../../../utils/is-locked';
import { LockButton } from '../../Common/Inputs/LockButton';
import { SaveButton } from '../../Common/Inputs/SaveButton';
import { StringInput } from '../../Common/Inputs/StringInput';

interface StateStringInputProps {
  path: Path;
}

export function StateStringInput(props: StateStringInputProps) {
  const getLockedPaths = createGetViewState('state', 'lockedPaths');
  const getHistoryId = createGetViewState('state', 'historyId');

  const currentValue = () => {
    const activeState = getActiveState();
    if (!activeState) return '';
    const pathValue = getObjectPathValue(activeState, props.path);
    return typeof pathValue === 'string' ? pathValue : '';
  };

  const getPath = () => props.path;
  const isReadOnly = () => getHistoryId() !== -1; // Not on latest
  const lockStatus = () => getLockStatus(getPath, getLockedPaths);
  const isDisabled = () => lockStatus() !== 'unlocked' || isReadOnly();

  const [localValue, setLocalValue] = createSignal(currentValue());

  // Sync local value when current value changes
  createEffect(() => setLocalValue(currentValue()));

  const handleSave = async () => {
    try {
      await setState(props.path, localValue());
    } catch (error) {
      console.error('Failed to save state:', error);
      // Reset to current value on error
      setLocalValue(currentValue());
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const disabled = isDisabled();
    if (e.key === 'Enter' && !disabled) {
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalValue(currentValue());
    }
  };

  const handleToggleLock = () => {
    if (lockStatus() === 'locked') {
      removeLockPath(props.path);
      setStatePropertyLock(props.path, false);
    } else if (lockStatus() === 'unlocked') {
      addLockPath(props.path);
      setStatePropertyLock(props.path, true);
    }
  };

  const hasChanges = () => localValue() !== currentValue();

  return (
    <div class="flex gap-2">
      <StringInput
        value={localValue()}
        onChange={setLocalValue}
        onKeyDown={handleKeyDown}
        disabled={isDisabled()}
        class="w-[184px]"
      />

      <Show when={hasChanges() && !isDisabled()}>
        <SaveButton onClick={handleSave} />
      </Show>

      <Show when={!isReadOnly() && !hasChanges()}>
        <LockButton status={lockStatus()} onToggle={handleToggleLock} />
      </Show>
    </div>
  );
}
