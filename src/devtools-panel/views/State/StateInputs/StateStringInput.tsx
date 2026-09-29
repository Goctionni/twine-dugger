import { createSignal, Show } from 'solid-js';

import { setState, setStatePropertyLock } from '@/devtools-panel/api/api';
import {
  addLockPath,
  createGetViewState,
  getActiveState,
  getLockedPaths,
  removeLockPath,
} from '@/devtools-panel/store/store';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { StringInput } from '@/devtools-panel/ui/inputs/StringInput';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import type { Path } from '@/shared/shared-types';

import { isPathEditable } from '../editable';
import { getLockStatus } from '../lock-helper';

interface StateStringInputProps {
  path: Path;
}

export function StateStringInput(props: StateStringInputProps) {
  const getHistoryRef = createGetViewState('state', 'historyRef');

  const currentValue = () => {
    const activeState = getActiveState();
    if (!activeState) return '';
    const pathValue = getObjectPathValue(activeState, props.path);
    return typeof pathValue === 'string' ? pathValue : '';
  };

  const getPath = () => props.path;
  const isReadOnly = () => getHistoryRef() !== 'latest';
  const lockStatus = () => getLockStatus(getPath, getLockedPaths);
  const isDisabled = () =>
    lockStatus() !== 'unlocked' || isReadOnly() || !isPathEditable(props.path);

  // Follows the current value until edited, then again when the current value changes
  const [localValue, setLocalValue] = createSignal(currentValue);

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
        class="w-46"
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
