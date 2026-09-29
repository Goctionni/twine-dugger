import { createSignal, Show } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { getActiveState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';
import { createGetViewState } from '@/devtools-panel/store/store';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { isPathEditable } from '../editable';
import { getLockStatus } from '../lock-helper';

interface StateNumberInputProps {
  path: Path;
}

export function StateNumberInput(props: StateNumberInputProps) {
  const getHistoryRef = createGetViewState('state', 'historyRef');

  const currentValue = () => {
    const activeState = getActiveState();
    if (!activeState) return 0;
    const pathValue = getPathValue(activeState, props.path);
    return typeof pathValue === 'number' ? pathValue : 0;
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
    if (lockStatus() === 'locked') setPathLock(props.path, false);
    else if (lockStatus() === 'unlocked') setPathLock(props.path, true);
  };

  const hasChanges = () => localValue() !== currentValue();

  return (
    <div class="flex gap-2">
      <NumberInput
        value={localValue()}
        onChange={setLocalValue}
        onKeyDown={handleKeyDown}
        disabled={isDisabled()}
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
